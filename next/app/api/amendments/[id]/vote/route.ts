import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import {
  computeVoteSummary,
  getActiveMemberCount,
  getActorFromRequest,
} from "@/lib/services/amendmentService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const amendmentId = Number(params.id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const actor = await getActorFromRequest(request);
  if (!actor?.isMember) {
    return new Response("Authentication required", { status: 401 });
  }

  let body: { approve?: boolean };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (typeof body.approve !== "boolean") {
    return new Response('"approve" must be true or false', { status: 422 });
  }

  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    select: {
      id: true,
      status: true,
      isSemanticChange: true,
    },
  });
  if (!amendment) {
    return new Response("Amendment not found", { status: 404 });
  }

  if (amendment.status !== AmendmentStatus.VOTING) {
    return new Response("Voting is not open for this amendment", { status: 409 });
  }

  if (!amendment.isSemanticChange && !actor.isPrimary) {
    return new Response("Only primary officers can vote on non-semantic amendments", { status: 403 });
  }

  await prisma.amendmentVote.upsert({
    where: {
      amendmentId_userId: {
        amendmentId,
        userId: actor.id,
      },
    },
    create: {
      amendmentId,
      userId: actor.id,
      approve: body.approve,
    },
    update: {
      approve: body.approve,
      createdAt: new Date(),
    },
  });

  const updatedAmendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    select: {
      id: true,
      status: true,
      isSemanticChange: true,
      votes: {
        select: { approve: true, userId: true },
      },
    },
  });
  if (!updatedAmendment) {
    return new Response("Failed to read vote updates", { status: 500 });
  }

  const voteSummary = computeVoteSummary(updatedAmendment.votes);
  const totalActiveMembers = await getActiveMemberCount();
  const quorum = Math.ceil(totalActiveMembers * (2 / 3));
  const quorumMet = voteSummary.totalVotes >= quorum || quorum === 0;
  const supermajority = Math.ceil(voteSummary.totalVotes * (2 / 3));

  return Response.json({
    status: updatedAmendment.status,
    voteSummary: {
      totalVotes: voteSummary.totalVotes,
      approveVotes: voteSummary.approveVotes,
      rejectVotes: voteSummary.rejectVotes,
      quorum,
      quorumMet,
      supermajority,
      isPassed: updatedAmendment.isSemanticChange
        ? voteSummary.totalVotes >= quorum && voteSummary.approveVotes >= supermajority
        : !voteSummary.totalVotes ? false : voteSummary.approveVotes > voteSummary.rejectVotes,
      hasUserVoted: true,
      userVote: body.approve,
    },
  });
}
