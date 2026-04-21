/**
 * SE Office → "Send our primary invites".
 *
 * For each certified winner (primary officers + the running-mate VP),
 * create/refresh an officer Invitation and email them the onboarding
 * link. This is the counterpart to /start-new-semester — it hydrates
 * the freshly-wiped officer roster with invites to the people the
 * membership actually elected.
 *
 * Auth: SE Admin only.
 */
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  PRESIDENT_TITLE,
  VICE_PRESIDENT_TITLE,
  compareByPrimaryOrder,
  getAcceptedRunningMate,
  getElectionWithRelations,
  tallyInstantRunoffElection,
  isTicketDerivedOffice,
} from "@/lib/elections";
import { getNextOfficerTermDateRange } from "@/lib/academicTerm";
import { sendEmail, isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

interface DispatchedInvite {
  positionTitle: string;
  email: string;
  name: string;
  created: boolean;
}

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
  if (!authLevel.isSeAdmin) {
    return new Response("Only SE Admin can send officer invites", {
      status: 403,
    });
  }

  try {
    const electionId = await parseElectionId(params);
    const election = await getElectionWithRelations({ id: electionId });
    if (!election) {
      return new Response("Election not found", { status: 404 });
    }
    if (election.status !== "CERTIFIED") {
      return new Response("Election must be certified first", { status: 409 });
    }

    // Compute winners per office using the same tally pipeline the
    // reveal / results pages use.
    const officesToTally = election.offices.filter(
      (o) => !isTicketDerivedOffice(o.officerPosition.title)
    );
    const rawResults = officesToTally.map((office) =>
      tallyInstantRunoffElection({
        office,
        ballots: election.ballots.map((ballot) => ({
          rankings: ballot.rankings.map((ranking) => ({
            electionOfficeId: ranking.electionOfficeId,
            nominationId: ranking.nominationId,
            rank: ranking.rank,
          })),
        })),
      })
    );

    // Build invite list: one per winning nomination + VP running mate.
    const invitesToCreate: Array<{
      positionId: number;
      positionTitle: string;
      user: { id: number; email: string; name: string };
    }> = [];

    for (const raw of rawResults) {
      if (!raw.winner) continue;
      const office = election.offices.find((o) => o.id === raw.officeId);
      if (!office) continue;
      const nomination = office.nominations.find((n) => n.id === raw.winner!.id);
      if (!nomination?.nominee.email) continue;
      invitesToCreate.push({
        positionId: office.officerPositionId,
        positionTitle: office.officerPosition.title,
        user: {
          id: nomination.nominee.id,
          email: nomination.nominee.email,
          name: nomination.nominee.name,
        },
      });
    }

    // VP from the winning presidential ticket.
    const presidentRaw = rawResults.find((r) => r.officeTitle === PRESIDENT_TITLE);
    const presidentOffice = election.offices.find(
      (o) => o.officerPosition.title === PRESIDENT_TITLE
    );
    const vpOffice = election.offices.find(
      (o) => o.officerPosition.title === VICE_PRESIDENT_TITLE
    );
    if (presidentRaw?.winner && presidentOffice && vpOffice) {
      const winningNom = presidentOffice.nominations.find(
        (n) => n.id === presidentRaw.winner!.id
      );
      const invitee = getAcceptedRunningMate(winningNom);
      if (invitee?.email) {
        invitesToCreate.push({
          positionId: vpOffice.officerPositionId,
          positionTitle: VICE_PRESIDENT_TITLE,
          user: {
            id: invitee.id,
            email: invitee.email,
            name: invitee.name,
          },
        });
      }
    }

    // Sort invites into canonical primary-office order so the email log,
    // the email order, and the returned JSON all read the same
    // (President → VP → Treasurer → Secretary → Mentoring Head).
    invitesToCreate.sort((a, b) =>
      compareByPrimaryOrder(a.positionTitle, b.positionTitle)
    );

    // Use the *next* officer cycle's dates. When a new semester starts
    // mid-term, `getDefaultOfficerTermDateRange(new Date())` would hand
    // back the cycle that's already mostly elapsed (Aug 1 last → May 31
    // next). We want to install these new officers into the upcoming
    // cycle (Aug 1 next → May 31 the year after).
    const { startDate, endDate } = getNextOfficerTermDateRange(new Date());

    // Upsert each invitation. The `(invitedEmail, type)` unique
    // constraint means at most one pending officer invite per email; if
    // one already exists (e.g. from a previous dispatch run), refresh
    // its position / term / expiry rather than 409ing.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const dispatched: DispatchedInvite[] = [];
    for (const item of invitesToCreate) {
      const existing = await prisma.invitation.findUnique({
        where: {
          invitedEmail_type: {
            invitedEmail: item.user.email,
            type: "officer",
          },
        },
      });
      if (existing) {
        await prisma.invitation.update({
          where: { id: existing.id },
          data: {
            positionId: item.positionId,
            startDate,
            endDate,
            invitedBy: authLevel.userId,
            expiresAt,
          },
        });
      } else {
        await prisma.invitation.create({
          data: {
            invitedEmail: item.user.email,
            type: "officer",
            positionId: item.positionId,
            startDate,
            endDate,
            invitedBy: authLevel.userId,
            expiresAt,
          },
        });
      }
      dispatched.push({
        positionTitle: item.positionTitle,
        email: item.user.email,
        name: item.user.name,
        created: !existing,
      });
    }

    // Fire-and-forget welcome emails to each invitee. Body points at
    // the SSE dashboard — OAuth sign-in + the invitation row will
    // translate them into Officer rows on first login.
    if (isEmailConfigured()) {
      const baseUrl =
        process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ||
        request.headers.get("origin") ||
        "";
      for (const item of invitesToCreate) {
        const subject = `You're our new ${item.positionTitle} — welcome aboard`;
        const html = `<p>Hi ${item.user.name},</p>
<p>The membership has spoken — you were elected <strong>${item.positionTitle}</strong> for the upcoming term.</p>
<p>Sign in with your RIT Google account to accept your officer role and get into your new dashboard:</p>
<p><a href="${baseUrl}/login">Accept your officer role</a></p>
<p>Congrats and welcome to the team.</p>
<p>— The Society of Software Engineers</p>`;
        const text = `You've been elected ${item.positionTitle}. Sign in at ${baseUrl}/login to accept.`;
        sendEmail({
          to: item.user.email,
          subject,
          html,
          text,
        }).catch((err) => console.error("officer invite email failed", err));
      }
    }

    return Response.json({
      ok: true,
      electionId,
      dispatched,
    });
  } catch (error) {
    return new Response(
      error instanceof Error
        ? error.message
        : "Failed to dispatch officer invites",
      { status: 400 }
    );
  }
}
