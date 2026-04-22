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
 * Body: { action: "ACCEPT" | "DECLINE", reason?: string }
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

  let body: { action?: unknown; reason?: unknown };
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
    if (invitation.status !== ElectionRunningMateStatus.INVITED) {
      return new Response("This invitation is no longer open", { status: 409 });
    }
    const now = new Date();
    if (now >= invitation.expiresAt) {
      // Treat as expired — flip state and refuse.
      await prisma.electionRunningMateInvitation.update({
        where: { id: invitation.id },
        data: { status: ElectionRunningMateStatus.EXPIRED },
      });
      return new Response("This invitation has expired", { status: 409 });
    }

    if (action === "ACCEPT") {
      if (!(await isActiveMemberForElection(authLevel.userId))) {
        return new Response(
          "You must be an active member to accept a running-mate invitation",
          { status: 403 }
        );
      }
    }

    const nextStatus =
      action === "ACCEPT"
        ? ElectionRunningMateStatus.ACCEPTED
        : ElectionRunningMateStatus.DECLINED;

    const updated = await prisma.electionRunningMateInvitation.update({
      where: { id: invitation.id },
      data: {
        status: nextStatus,
        respondedAt: now,
        declineReason:
          action === "DECLINE" && typeof body.reason === "string"
            ? body.reason.trim() || null
            : null,
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
