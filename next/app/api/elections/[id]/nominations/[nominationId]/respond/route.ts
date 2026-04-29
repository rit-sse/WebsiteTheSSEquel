import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getNominationResponseDeadline } from "@/lib/elections";
import { ElectionNominationStatus, ElectionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

async function parseIds(
  params: Promise<{ id: string; nominationId: string }>
) {
  const { id, nominationId } = await params;
  const electionId = Number(id);
  const parsedNominationId = Number(nominationId);
  if (!Number.isInteger(electionId) || !Number.isInteger(parsedNominationId)) {
    throw new Error("Invalid election or nomination ID");
  }
  return { electionId, nominationId: parsedNominationId };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; nominationId: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("You must be signed in to respond to a nomination", {
      status: 401,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const status = body.status as string | undefined;
  if (
    status !== ElectionNominationStatus.ACCEPTED &&
    status !== ElectionNominationStatus.DECLINED &&
    status !== ElectionNominationStatus.WITHDRAWN
  ) {
    return new Response("status must be ACCEPTED, DECLINED, or WITHDRAWN", {
      status: 400,
    });
  }

  try {
    const { electionId, nominationId } = await parseIds(params);
    const nomination = await prisma.electionNomination.findUnique({
      where: { id: nominationId },
      include: {
        electionOffice: {
          include: {
            election: true,
          },
        },
      },
    });
    if (!nomination || nomination.electionOffice.electionId !== electionId) {
      return new Response("Nomination not found", { status: 404 });
    }
    if (nomination.nomineeUserId !== authLevel.userId) {
      return new Response("Only the nominee can respond", { status: 403 });
    }

    const election = nomination.electionOffice.election;
    const now = new Date();

    // Per-nomination candidate profiles can be edited any time after
    // accept and right up until the election is certified — the SE
    // Office wants candidates to be able to refine their bio while
    // voting is open and even after voting closes (during the runoff /
    // pre-certify window). We detect a profile edit by the request
    // status being ACCEPTED while the nomination is already ACCEPTED,
    // i.e. the status isn't actually transitioning.
    const isProfileEdit =
      status === ElectionNominationStatus.ACCEPTED &&
      nomination.status === ElectionNominationStatus.ACCEPTED;

    if (status === ElectionNominationStatus.WITHDRAWN) {
      // Withdraw is a separate window from accept/decline. Per the SE
      // Office: candidates can pull out at any point up until voting
      // CLOSES (not just before voting opens). Only ACCEPTED rows can
      // be withdrawn — pulling out a still-pending nomination is just
      // DECLINING.
      if (nomination.status !== ElectionNominationStatus.ACCEPTED) {
        return new Response(
          "Only an accepted nomination can be withdrawn",
          { status: 409 }
        );
      }
      if (
        election.status === ElectionStatus.VOTING_CLOSED ||
        election.status === ElectionStatus.CERTIFIED ||
        election.status === ElectionStatus.CANCELLED ||
        now >= election.votingCloseAt
      ) {
        return new Response(
          "Voting has already closed — nominations can no longer be withdrawn",
          { status: 409 }
        );
      }
    } else if (isProfileEdit) {
      // Already-accepted candidates editing their bio / program /
      // eligibility. Allowed throughout NOMINATIONS_OPEN/CLOSED,
      // VOTING_OPEN/CLOSED, and TIE_RUNOFF_REQUIRED — only blocked
      // once the election is locked in (CERTIFIED) or killed
      // (CANCELLED). This is the new "edit my profile from /elections/me
      // any time until the election is certified" flow.
      if (
        election.status === ElectionStatus.CERTIFIED ||
        election.status === ElectionStatus.CANCELLED
      ) {
        return new Response(
          "This election is closed — candidate profiles can no longer be edited",
          { status: 409 }
        );
      }
    } else {
      // Initial accept / decline transition from PENDING_RESPONSE.
      // Still gated on the response deadline (24h before voting opens).
      if (now >= getNominationResponseDeadline(election)) {
        return new Response(
          "The response deadline for this nomination has passed",
          { status: 409 }
        );
      }
    }

    // Candidate profile fields. Each nomination keeps its own copy —
    // running for more than one office in the same election now lets
    // the candidate pitch separately per race.
    const profile = {
      statement: String(body.statement ?? "").trim(),
      yearLevel:
        body.yearLevel !== undefined && body.yearLevel !== null
          ? Number(body.yearLevel)
          : null,
      program:
        body.program !== undefined && body.program !== null
          ? String(body.program).trim()
          : null,
      canRemainEnrolledFullYear:
        body.canRemainEnrolledFullYear !== undefined
          ? Boolean(body.canRemainEnrolledFullYear)
          : null,
      canRemainEnrolledNextTerm:
        body.canRemainEnrolledNextTerm !== undefined
          ? Boolean(body.canRemainEnrolledNextTerm)
          : null,
      isOnCampus:
        body.isOnCampus !== undefined ? Boolean(body.isOnCampus) : null,
      isOnCoop: body.isOnCoop !== undefined ? Boolean(body.isOnCoop) : null,
    };

    // On a fresh ACCEPT the candidate's blurb / eligibility comes from
    // the form. On WITHDRAWN there's nothing in the request body — we
    // want to preserve the existing profile (so the audit trail keeps
    // showing what they had before pulling out) instead of blanking it.
    const updated = await prisma.electionNomination.update({
      where: { id: nominationId },
      data: {
        status: status as ElectionNominationStatus,
        ...(status === ElectionNominationStatus.WITHDRAWN ? {} : profile),
      },
      include: {
        nominee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Per-nomination candidate profiles: each ElectionNomination row
    // holds its own bio / program / year / eligibility independently
    // so a candidate running for multiple offices in the same primary
    // can pitch differently for each race. We deliberately do NOT
    // mirror the just-saved profile to their other nominations.

    return Response.json(updated);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to respond to nomination",
      { status: 400 }
    );
  }
}
