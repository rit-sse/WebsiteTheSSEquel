/**
 * Kick off a new semester after a certified election.
 *
 * Behaviour (the single handover orchestrator):
 *  1. Memberships are *not* touched — they're already tagged with
 *     their term+year on create, so the old rows archive themselves.
 *     New sign-ups naturally create fresh rows in the incoming term.
 *  2. Rotate MentorSemester — flip any active row to `isActive=false`
 *     and create a new row for the next semester with canonical
 *     dates. Existing MentorApplication / MentorAvailability /
 *     MentorHeadcountEntry rows keep pointing at their parent
 *     semester (historical), while new ones pick up the new active
 *     row via the existing `?activeOnly=true` query pattern.
 *  3. Deactivate every Mentor row (preserving rows for history).
 *  4. Deactivate every Officer EXCEPT SE Admin (SE Office is the
 *     multi-term anchor — they rehydrate the primaries via the
 *     `send-officer-invites` flow).
 *  5. Email every active SE Admin with a deep-link to the dispatch
 *     page where they send the fresh officer invitations.
 *
 * Auth: the current President (who ran the election) or any SE Admin.
 */
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  SE_ADMIN_POSITION_TITLE,
  isUserCurrentPresident,
} from "@/lib/seAdmin";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import {
  formatAcademicTerm,
  getAcademicTermDateRange,
  getNextSemester,
} from "@/lib/academicTerm";
import { openCommitteeHeadNominationCycleForHandoff } from "@/lib/committeeHeadNominations";

export const dynamic = "force-dynamic";

async function parseElectionId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) {
    throw new Error("Invalid election ID");
  }
  return parsed;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("Sign in required", { status: 401 });
  }
  const isPresident = await isUserCurrentPresident(authLevel.userId);
  if (!isPresident && !authLevel.isSeAdmin) {
    return new Response("Only the sitting President or SE Admin can start a new semester", {
      status: 403,
    });
  }

  try {
    const electionId = await parseElectionId(params);
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { id: true, slug: true, title: true, status: true },
    });
    if (!election) {
      return new Response("Election not found", { status: 404 });
    }
    if (election.status !== "CERTIFIED") {
      return new Response(
        "Only a certified election can kick off a new semester",
        { status: 409 }
      );
    }

    const now = new Date();
    // Default application window: 14 days on either side of semester start.
    const APPLICATION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

    // Dates for the incoming semester — canonical month boundaries from
    // `getAcademicTermDateRange`, term/year chosen by `getNextSemester`.
    const nextTerm = getNextSemester(now);
    const nextRange = getAcademicTermDateRange(nextTerm.term, nextTerm.year);

    await prisma.$transaction(async (tx) => {
      // 1. Memberships: no action. They're tagged by term+year on
      //    create (see isActiveMemberForElection + memberships APIs),
      //    so the old rows archive themselves the moment the calendar
      //    flips.

      // 2. Rotate MentorSemester — old active → inactive, create a
      //    new active row for the incoming term.
      await tx.mentorSemester.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      await tx.mentorSemester.create({
        data: {
          name: formatAcademicTerm(nextTerm.term, nextTerm.year),
          isActive: true,
          semesterStart: nextRange.startDate,
          semesterEnd: nextRange.endDate,
          applicationOpen: new Date(
            nextRange.startDate.getTime() - APPLICATION_WINDOW_MS
          ),
          applicationClose: new Date(
            nextRange.startDate.getTime() + APPLICATION_WINDOW_MS
          ),
        },
      });

      // 3. Deactivate every Mentor row. We preserve the rows for history
      //    rather than deleting so that downstream features (prior-term
      //    rosters, stats, applications) stay referentially intact.
      await tx.mentor.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // 4. Deactivate all officers except SE Admin. SE Office is the
      //    multi-term anchor — they receive the invite dispatch email in
      //    step 5 and rehydrate the primary roster from the election
      //    winners.
      await tx.officer.updateMany({
        where: {
          is_active: true,
          position: { title: { not: SE_ADMIN_POSITION_TITLE } },
        },
        data: {
          is_active: false,
          end_date: now,
        },
      });
    });

    // 4. Gather SE Admin recipients and email them.
    const seAdmins = await prisma.officer.findMany({
      where: {
        is_active: true,
        position: { title: SE_ADMIN_POSITION_TITLE },
      },
      select: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ||
      request.headers.get("origin") ||
      "";
    const invitePageUrl = `${baseUrl}/dashboard/new-semester/${electionId}`;

    if (isEmailConfigured() && seAdmins.length > 0) {
      const subject = `[${election.title}] New semester started — send officer invites`;
      const html = `<p>Hi SE Office,</p>
<p>The President has started a new semester following the certification of
<strong>${election.title}</strong>. Mentors and non–SE-Admin officers
have been deactivated and a fresh <strong>${formatAcademicTerm(nextTerm.term, nextTerm.year)}</strong>
MentorSemester is now active. Last term's memberships remain in the
database tagged with their original term, but only new sign-ups for
the incoming term will count as active members.</p>
<p>The next step is yours: visit the dispatch page and send the officer
invitations to the newly-elected primaries.</p>
<p><a href="${invitePageUrl}">Open the new-semester dispatch page</a></p>
<p>— The Society of Software Engineers</p>`;
      const text = `A new semester (${formatAcademicTerm(nextTerm.term, nextTerm.year)}) has started after ${election.title}. Visit ${invitePageUrl} to send the officer invitations to the newly-elected primaries.`;
      // Fan out email sends, don't block the response on failures.
      for (const admin of seAdmins) {
        if (!admin.user?.email) continue;
        sendEmail({
          to: admin.user.email,
          subject,
          html,
          text,
        }).catch((err) =>
          console.error("start-new-semester email failed", err)
        );
      }
    }

    const committeeHeadCycle = await openCommitteeHeadNominationCycleForHandoff(
      electionId,
      now
    );

    return Response.json({
      ok: true,
      inviteDispatchUrl: `/dashboard/new-semester/${electionId}`,
      seAdminsNotified: seAdmins.length,
      committeeHeadNominationCycle: committeeHeadCycle,
    });
  } catch (error) {
    return new Response(
      error instanceof Error
        ? error.message
        : "Failed to start new semester",
      { status: 400 }
    );
  }
}
