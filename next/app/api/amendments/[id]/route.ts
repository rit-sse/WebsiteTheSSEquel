import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import {
  computeVoteSummary,
  getActiveMemberCount,
  getActorFromRequest,
} from "@/lib/services/amendmentService";

export const dynamic = "force-dynamic";

function sanitizeStatus(value: string | null): AmendmentStatus | null {
  if (!value) return null;

  const candidate = value.toUpperCase();
  if (candidate in AmendmentStatus) {
    return candidate as AmendmentStatus;
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const amendmentId = Number(params.id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const actor = await getActorFromRequest(request);
  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImageKey: true,
          googleImageURL: true,
        },
      },
      votes: {
        select: { id: true, userId: true, approve: true, createdAt: true },
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              profileImageKey: true,
              googleImageURL: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!amendment) {
    return new Response("Amendment not found", { status: 404 });
  }

  const voteSummary = computeVoteSummary(amendment.votes);
  const totalActiveMembers = await getActiveMemberCount();
  const requiredVotingParticipation = Math.ceil(totalActiveMembers * (2 / 3));
  const quorumAchieved =
    voteSummary.totalVotes >= requiredVotingParticipation || requiredVotingParticipation === 0;

  const approvingVotesRequired = Math.ceil(voteSummary.totalVotes * (2 / 3));
  const hasSupermajority = voteSummary.totalVotes > 0 && voteSummary.approveVotes >= approvingVotesRequired;
  const userVote = actor?.id ? amendment.votes.find((vote) => vote.userId === actor.id)?.approve : null;

  return Response.json({
    id: amendment.id,
    title: amendment.title,
    description: amendment.description,
    status: amendment.status,
    originalContent: amendment.originalContent,
    proposedContent: amendment.proposedContent,
    githubPrNumber: amendment.githubPrNumber,
    githubBranch: amendment.githubBranch,
    isSemanticChange: amendment.isSemanticChange,
    createdAt: amendment.createdAt,
    updatedAt: amendment.updatedAt,
    publishedAt: amendment.publishedAt,
    votingOpenedAt: amendment.votingOpenedAt,
    votingClosedAt: amendment.votingClosedAt,
    author: amendment.author,
    votes: {
      totalVotes: voteSummary.totalVotes,
      approveVotes: voteSummary.approveVotes,
      rejectVotes: voteSummary.rejectVotes,
      requiredVotingParticipation,
      quorumAchieved,
      requiredApproveVotes: approvingVotesRequired,
      hasSupermajority,
      totalActiveMembers,
    },
    userVote,
    comments: amendment.comments,
  });
}

function canChangeStatus(
  actor: { isPrimary: boolean; id: number } | null,
  amendment: { authorId: number },
  requestedStatus: AmendmentStatus,
) {
  if (!actor) {
    return false;
  }

  if (requestedStatus === "WITHDRAWN") {
    return actor.isPrimary || amendment.authorId === actor.id;
  }

  return actor.isPrimary;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const amendmentId = Number(params.id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const actor = await getActorFromRequest(request);
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const requestedStatus = sanitizeStatus(body.status ?? null);
  if (!requestedStatus) {
    return new Response("Invalid status value", { status: 422 });
  }

  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    select: { id: true, status: true, authorId: true, publishedAt: true },
  });
  if (!amendment) {
    return new Response("Amendment not found", { status: 404 });
  }

  if (!canChangeStatus(actor, amendment, requestedStatus)) {
    return new Response("Only primary officers or the author may update this amendment", { status: 403 });
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { status: requestedStatus };

  if (requestedStatus === "OPEN" && amendment.status !== "OPEN") {
    updateData.publishedAt = now;
  }
  if (requestedStatus === "VOTING" && amendment.status !== "VOTING") {
    if (!amendment.publishedAt) {
      return new Response("Cannot open voting before this amendment is published.", { status: 409 });
    }
    const publicationCutoff = amendment.publishedAt.getTime() + 7 * 24 * 60 * 60 * 1000;
    if (publicationCutoff > Date.now()) {
      return new Response("Amendment must stay open for at least 7 days before voting begins.", {
        status: 409,
      });
    }
    updateData.votingOpenedAt = now;
  }
  if ((requestedStatus === "APPROVED" || requestedStatus === "REJECTED") && amendment.status !== requestedStatus) {
    updateData.votingClosedAt = now;
  }

  const updated = await prisma.amendment.update({
    where: { id: amendmentId },
    data: updateData,
  });

  return Response.json(updated);
}
