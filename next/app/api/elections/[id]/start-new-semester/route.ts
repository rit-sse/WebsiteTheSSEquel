/**
 * Kick off a new semester after a certified election.
 *
 * Behaviour (the single handover orchestrator):
 *  1. Memberships are *not* touched — they're already tagged with
 *     their term+year on create, so the old rows archive themselves.
 *     New sign-ups naturally create fresh rows in the incoming term.
 *  2. Rotate MentorSemester to the next SSE operational term. Summer
 *     is skipped because SSE is closed then; after Spring, the next
 *     active term is Fall.
 *  3. Deactivate every Mentor row (preserving rows for history).
 *  4. Deactivate every Officer EXCEPT SE Office.
 *  5. Create officer invitations for the already-certified winners
 *     using the same invitation records/email used by the Positions
 *     and Officers page. This happens only after positions are open.
 *  6. Open the committee-head nomination/application cycle for the
 *     incoming SSE term.
 *
 * Auth: the current President (who ran the election) or any SE Admin.
 */
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { SE_ADMIN_POSITION_TITLE, isUserCurrentPresident } from "@/lib/seAdmin";
import {
  getAcademicTermDateRange,
  getNextOfficerTermDateRange,
} from "@/lib/academicTerm";
import { openCommitteeHeadNominationCycleForHandoff } from "@/lib/committeeHeadNominations";
import { compareByPrimaryOrder } from "@/lib/elections";
import {
  createOfficerInvitationRecord,
  InvitationError,
  type OfficerInvitationDispatch,
  sendOfficerInvitationEmail,
} from "@/lib/officerInvitations";
import { getPublicBaseUrl } from "@/lib/baseUrl";
import {
  formatSseOperationalTerm,
  getNextSseOperationalTerm,
} from "@/lib/sseTerms";
import { ElectionStatus, PositionCategory } from "@prisma/client";
import { NextRequest } from "next/server";

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("Sign in required", { status: 401 });
  }
  const isPresident = await isUserCurrentPresident(authLevel.userId);
  if (!isPresident && !authLevel.isSeAdmin) {
    return new Response(
      "Only the sitting President or SE Admin can start a new semester",
      {
        status: 403,
      },
    );
  }

  try {
    const electionId = await parseElectionId(params);
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        offices: {
          select: {
            officerPositionId: true,
            officerPosition: {
              select: {
                id: true,
                title: true,
                is_primary: true,
              },
            },
          },
        },
      },
    });
    if (!election) {
      return new Response("Election not found", { status: 404 });
    }
    if (election.status !== ElectionStatus.CERTIFIED) {
      return new Response(
        "Only a certified election can kick off a new semester",
        { status: 409 },
      );
    }

    const now = new Date();
    // Default application window: 14 days on either side of semester start.
    const APPLICATION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

    const primaryElectionPositions = election.offices
      .map((office) => office.officerPosition)
      .filter((position) => position.is_primary);
    if (primaryElectionPositions.length === 0) {
      return new Response("This election has no primary officer positions", {
        status: 409,
      });
    }

    const certifiedOfficers = await prisma.officer.findMany({
      where: {
        is_active: true,
        position_id: { in: primaryElectionPositions.map((item) => item.id) },
      },
      select: {
        user: { select: { id: true, name: true, email: true } },
        position: { select: { id: true, title: true } },
      },
    });
    const certifiedOfficerByPositionId = new Map(
      certifiedOfficers.map((officer) => [officer.position.id, officer]),
    );
    const missingPositions = primaryElectionPositions
      .filter((position) => !certifiedOfficerByPositionId.has(position.id))
      .map((position) => position.title);
    if (missingPositions.length > 0) {
      return new Response(
        `Certified winners must still be active before handoff. Missing active officer records for: ${missingPositions.join(", ")}.`,
        { status: 409 },
      );
    }

    const officersToInvite = primaryElectionPositions
      .map((position) => certifiedOfficerByPositionId.get(position.id)!)
      .sort((a, b) =>
        compareByPrimaryOrder(a.position.title, b.position.title),
      );

    const nextTerm = getNextSseOperationalTerm(now);
    const nextRange = getAcademicTermDateRange(nextTerm.term, nextTerm.year);
    const nextTermName = formatSseOperationalTerm(nextTerm.term, nextTerm.year);
    const officerTerm = getNextOfficerTermDateRange(now);

    await prisma.$transaction(async (tx) => {
      // 1. Memberships: no action. They're tagged by term+year on
      //    create (see isActiveMemberForElection + memberships APIs),
      //    so the old rows archive themselves the moment the calendar
      //    flips.

      // 2. Rotate MentorSemester. Reuse an existing row for the target
      //    term if one exists so repeated attempts don't create duplicate
      //    active semesters.
      await tx.mentorSemester.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const existingMentorSemester = await tx.mentorSemester.findFirst({
        where: { name: nextTermName },
        orderBy: { id: "desc" },
      });
      const mentorSemesterData = {
        name: nextTermName,
        isActive: true,
        semesterStart: nextRange.startDate,
        semesterEnd: nextRange.endDate,
        applicationOpen: new Date(
          nextRange.startDate.getTime() - APPLICATION_WINDOW_MS,
        ),
        applicationClose: new Date(
          nextRange.startDate.getTime() + APPLICATION_WINDOW_MS,
        ),
      };
      if (existingMentorSemester) {
        await tx.mentorSemester.update({
          where: { id: existingMentorSemester.id },
          data: mentorSemesterData,
        });
      } else {
        await tx.mentorSemester.create({
          data: mentorSemesterData,
        });
      }

      // 3. Deactivate every Mentor row. We preserve the rows for history
      //    rather than deleting so that downstream features (prior-term
      //    rosters, stats, applications) stay referentially intact.
      await tx.mentor.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // 4. Deactivate all officers except SE Office. The legacy title
      //    check is retained for databases that still have the old
      //    literal SE Admin position.
      await tx.officer.updateMany({
        where: {
          is_active: true,
          NOT: [
            { position: { category: PositionCategory.SE_OFFICE } },
            { position: { title: SE_ADMIN_POSITION_TITLE } },
          ],
        },
        data: {
          is_active: false,
          end_date: now,
        },
      });
    });

    const committeeHeadCycle = await openCommitteeHeadNominationCycleForHandoff(
      electionId,
      now,
    );

    const baseUrl = getPublicBaseUrl(request);
    const officerInvitations: OfficerInvitationDispatch[] = [];
    for (const officer of officersToInvite) {
      try {
        const { invitation, created } = await createOfficerInvitationRecord({
          email: officer.user.email,
          positionId: officer.position.id,
          startDate: officerTerm.startDate,
          endDate: officerTerm.endDate,
          invitedBy: authLevel.userId,
          refreshExisting: true,
        });

        let emailSent = false;
        try {
          emailSent = await sendOfficerInvitationEmail({
            invitation,
            baseUrl,
          });
        } catch (emailError) {
          console.error("start-new-semester officer invite email failed", {
            email: officer.user.email,
            error: emailError,
          });
        }

        officerInvitations.push({
          positionTitle: officer.position.title,
          email: officer.user.email,
          name: officer.user.name,
          created,
          emailSent,
        });
      } catch (error) {
        if (error instanceof InvitationError) {
          return new Response(error.message, { status: error.status });
        }
        throw error;
      }
    }

    return Response.json({
      ok: true,
      mentorSemester: {
        name: nextTermName,
        term: nextTerm.term,
        year: nextTerm.year,
      },
      officerInvitations,
      officerInvitationsCreated: officerInvitations.filter(
        (item) => item.created,
      ).length,
      officerInvitationEmailsSent: officerInvitations.filter(
        (item) => item.emailSent,
      ).length,
      committeeHeadNominationCycle: committeeHeadCycle,
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to start new semester",
      { status: 400 },
    );
  }
}
