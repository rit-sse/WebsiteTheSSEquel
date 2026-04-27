import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { isActiveMemberForElection } from "@/lib/electionEligibility";
import { ElectionRunningMateStatus } from "@prisma/client";

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

/**
 * Running-mate invitee accepts or declines their invitation.
 *
 * Body: {
 *   action: "ACCEPT" | "DECLINE",
 *   reason?: string,
 *   // Candidate-profile fields (only honored on ACCEPT, all optional —
 *   // omitted fields are unchanged):
 *   statement?: string,
 *   yearLevel?: number | null,
 *   program?: string | null,
 *   canRemainEnrolledFullYear?: boolean | null,
 *   canRemainEnrolledNextTerm?: boolean | null,
 *   isOnCampus?: boolean | null,
 *   isOnCoop?: boolean | null,
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; nominationId: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("You must be signed in to respond to a running-mate invite", {
      status: 401,
    });
  }

  let body: {
    action?: unknown;
    reason?: unknown;
    statement?: unknown;
    yearLevel?: unknown;
    program?: unknown;
    canRemainEnrolledFullYear?: unknown;
    canRemainEnrolledNextTerm?: unknown;
    isOnCampus?: unknown;
    isOnCoop?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const action = String(body.action ?? "").toUpperCase();
  if (action !== "ACCEPT" && action !== "DECLINE") {
    return new Response('action must be "ACCEPT" or "DECLINE"', {
      status: 400,
    });
  }

  try {
    const { electionId, nominationId } = await parseIds(params);
    const invitation = await prisma.electionRunningMateInvitation.findUnique({
      where: { presidentNominationId: nominationId },
      include: {
        presidentNomination: {
          include: {
            electionOffice: true,
          },
        },
      },
    });
    if (
      !invitation ||
      invitation.presidentNomination.electionOffice.electionId !== electionId
    ) {
      return new Response("Running-mate invitation not found", { status: 404 });
    }
    if (invitation.inviteeUserId !== authLevel.userId) {
      return new Response("Only the invitee can respond to this invitation", {
        status: 403,
      });
    }

    // VP candidates need to come back later and edit their blurb /
    // program / eligibility — that's a PATCH with action=ACCEPT against
    // an already-ACCEPTED row. Allow it. Anything else (DECLINE on an
    // ACCEPTED row, any action on EXPIRED/WITHDRAWN/DECLINED) is still
    // 409.
    const isProfileEdit =
      action === "ACCEPT" &&
      invitation.status === ElectionRunningMateStatus.ACCEPTED;
    if (!isProfileEdit && invitation.status !== ElectionRunningMateStatus.INVITED) {
      return new Response("This invitation is no longer open", { status: 409 });
    }

    // The invitation TTL only governs the initial accept/decline. Once
    // someone has already accepted, profile edits are allowed indefinitely
    // (or until the regular nomination response deadline elsewhere takes
    // over) — auto-expiring would otherwise lock VPs out of editing once
    // ~22h have passed.
    const now = new Date();
    if (
      !isProfileEdit &&
      invitation.status === ElectionRunningMateStatus.INVITED &&
      now >= invitation.expiresAt
    ) {
      await prisma.electionRunningMateInvitation.update({
        where: { id: invitation.id },
        data: { status: ElectionRunningMateStatus.EXPIRED },
      });
      return new Response("This invitation has expired", { status: 409 });
    }

    if (action === "ACCEPT" && !isProfileEdit) {
      if (!(await isActiveMemberForElection(authLevel.userId))) {
        return new Response(
          "You must be an active member to accept a running-mate invitation",
          { status: 403 }
        );
      }
    }

    // On a profile-edit PATCH, status stays ACCEPTED — only the
    // candidate-profile fields below get persisted.
    const nextStatus = isProfileEdit
      ? ElectionRunningMateStatus.ACCEPTED
      : action === "ACCEPT"
        ? ElectionRunningMateStatus.ACCEPTED
        : ElectionRunningMateStatus.DECLINED;

    // Candidate-profile fields are only honored on ACCEPT and only when
    // the field is present in the body — that lets the same endpoint handle
    // both "accept + initial profile" and a later "edit my profile" PATCH
    // without forcing the caller to resend every field.
    const profilePatch: Record<string, unknown> = {};
    if (action === "ACCEPT") {
      if (typeof body.statement === "string") {
        profilePatch.statement = body.statement;
      }
      if (body.yearLevel === null) {
        profilePatch.yearLevel = null;
      } else if (typeof body.yearLevel === "number") {
        profilePatch.yearLevel = body.yearLevel;
      }
      if (body.program === null) {
        profilePatch.program = null;
      } else if (typeof body.program === "string") {
        profilePatch.program = body.program.trim() || null;
      }
      for (const key of [
        "canRemainEnrolledFullYear",
        "canRemainEnrolledNextTerm",
        "isOnCampus",
        "isOnCoop",
      ] as const) {
        const v = body[key];
        if (typeof v === "boolean" || v === null) {
          profilePatch[key] = v;
        }
      }
    }

    const updated = await prisma.electionRunningMateInvitation.update({
      where: { id: invitation.id },
      data: {
        status: nextStatus,
        // Don't overwrite the original respondedAt timestamp when this
        // is just a profile edit on an already-ACCEPTED invitation.
        ...(isProfileEdit ? {} : { respondedAt: now }),
        // Same for declineReason — only relevant on a fresh DECLINE.
        ...(isProfileEdit
          ? {}
          : {
              declineReason:
                action === "DECLINE" && typeof body.reason === "string"
                  ? body.reason.trim() || null
                  : null,
            }),
        ...profilePatch,
      },
    });

    return Response.json(updated);
  } catch (error) {
    return new Response(
      error instanceof Error
        ? error.message
        : "Failed to respond to running-mate invitation",
      { status: 400 }
    );
  }
}
