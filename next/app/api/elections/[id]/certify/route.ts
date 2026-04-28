import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  certifyElection,
  serializeElectionForClient,
} from "@/lib/elections";
import prisma from "@/lib/prisma";
import { ElectionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  // Certification is a single-action SE Office button — drop the old
  // "President + distinct SE Admin" dual-approval gate that made it
  // impossible to actually click certify (one person can't satisfy
  // both halves of a 2-person approval, and the dashboard only ever
  // had a single Certify button anyway).
  if (!authLevel.isSeAdmin || !authLevel.userId) {
    return new Response("Only an SE Admin can certify elections", {
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
