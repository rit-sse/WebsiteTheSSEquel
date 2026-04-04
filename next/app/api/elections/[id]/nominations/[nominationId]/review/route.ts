import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getElectionApprovalRole } from "@/lib/seAdmin";
import { ElectionEligibilityStatus } from "@prisma/client";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; nominationId: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  const approvalRole = await getElectionApprovalRole(authLevel);
  if (!authLevel.userId || !approvalRole) {
    return new Response(
      "Only the current President or an SE Admin can review candidate eligibility",
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eligibilityStatus = body.eligibilityStatus as string | undefined;
  if (
    eligibilityStatus !== ElectionEligibilityStatus.APPROVED &&
    eligibilityStatus !== ElectionEligibilityStatus.REJECTED
  ) {
    return new Response("eligibilityStatus must be APPROVED or REJECTED", {
      status: 400,
    });
  }

  try {
    const { electionId, nominationId } = await parseIds(params);
    const nomination = await prisma.electionNomination.findUnique({
      where: { id: nominationId },
      include: {
        electionOffice: true,
      },
    });
    if (!nomination || nomination.electionOffice.electionId !== electionId) {
      return new Response("Nomination not found", { status: 404 });
    }

    const updated = await prisma.electionNomination.update({
      where: { id: nominationId },
      data: {
        eligibilityStatus: eligibilityStatus as ElectionEligibilityStatus,
        reviewNotes:
          body.reviewNotes !== undefined ? String(body.reviewNotes).trim() : null,
        reviewedById: authLevel.userId,
        reviewedAt: new Date(),
      },
    });

    return Response.json(updated);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to review nomination",
      { status: 400 }
    );
  }
}
