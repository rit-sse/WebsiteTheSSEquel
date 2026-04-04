import { tallyElectionResults } from "@/lib/elections";
import { ElectionStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const visibleStatuses = new Set<ElectionStatus>([
    ElectionStatus.VOTING_CLOSED,
    ElectionStatus.CERTIFIED,
    ElectionStatus.TIE_RUNOFF_REQUIRED,
  ]);
  if (!visibleStatuses.has(election.status)) {
    return new Response("Results are not available until voting has closed", {
      status: 409,
    });
  }

  const results = await tallyElectionResults(electionId);
  if (!results) {
    return new Response("Election not found", { status: 404 });
  }

  return Response.json(results);
}
