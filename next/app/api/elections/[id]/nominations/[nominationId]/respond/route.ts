import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getNominationResponseDeadline } from "@/lib/elections";
import { propagateCandidateProfile } from "@/lib/electionCandidateProfile";
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
    } else {
      // Regular accept/decline flow uses the response deadline (24h
      // before voting opens), unchanged from before.
      if (now >= getNominationResponseDeadline(election)) {
        return new Response(
          "The response deadline for this nomination has passed",
          { status: 409 }
        );
      }
    }

    // Build the candidate-profile patch once so the primary update and
    // the cross-nomination propagation share the exact same values.
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

    // The same person frequently runs for multiple offices in the
    // same election (and may also be someone's VP invitee). Mirror
    // the profile they just saved across every other open nomination
    // and running-mate invitation they hold so they don't have to
    // re-type their bio for each acceptance, and the public page
    // shows them with one consistent blurb. Only propagate on ACCEPT
    // — declined rows have no meaningful profile to share.
    if (status === ElectionNominationStatus.ACCEPTED) {
      try {
        await propagateCandidateProfile(electionId, authLevel.userId, profile, {
          excludeNominationId: nominationId,
        });
      } catch (error) {
        // Non-fatal: the primary write already succeeded. Log so we
        // notice if the propagation path starts failing in prod.
        console.error("Failed to propagate candidate profile:", error);
      }
    }

    return Response.json(updated);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to respond to nomination",
      { status: 400 }
    );
  }
}
