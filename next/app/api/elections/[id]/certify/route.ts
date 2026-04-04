import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  certifyElection,
  serializeElectionForClient,
  stageHasRequiredApprovals,
} from "@/lib/elections";
import prisma from "@/lib/prisma";
import { ElectionApprovalStage, ElectionStatus } from "@prisma/client";
import { canManageElections } from "@/lib/seAdmin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!(await canManageElections(authLevel)) || !authLevel.userId) {
    return new Response("Only the President or an SE Admin can certify elections", {
      status: 403,
    });
  }

  const { id } = await params;
  const electionId = Number(id);
  if (!Number.isInteger(electionId)) {
    return new Response("Invalid election ID", { status: 400 });
  }

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { status: true },
  });
  if (!election) {
    return new Response("Election not found", { status: 404 });
  }
  if (election.status !== ElectionStatus.VOTING_CLOSED) {
    return new Response("Only closed elections can be certified", { status: 409 });
  }
  if (
    !(await stageHasRequiredApprovals(
      electionId,
      ElectionApprovalStage.CERTIFICATION
    ))
  ) {
    return new Response(
      "CERTIFICATION approval requires the President and one distinct SE Admin",
      { status: 409 }
    );
  }

  try {
    const certified = await certifyElection(electionId, authLevel.userId);
    return Response.json(serializeElectionForClient(certified));
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to certify election",
      { status: 400 }
    );
  }
}
