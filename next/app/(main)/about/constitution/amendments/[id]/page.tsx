import prisma from "@/lib/prisma";
import { resolveUserImage } from "@/lib/s3Utils";
import { computeVoteSummary, getActiveMemberCount } from "@/lib/services/amendmentService";
import AmendmentDetailClient from "@/components/amendments/AmendmentDetailClient";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { notFound } from "next/navigation";

type RouteParams = {
  params: {
    id: string;
  };
};

export const dynamic = "force-dynamic";

async function getAmendmentDetails(amendmentId: number) {
  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      votes: {
        select: { userId: true, approve: true },
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              profileImageKey: true,
              googleImageURL: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!amendment) return null;

  const voteSummary = computeVoteSummary(amendment.votes);
  const totalActiveMembers = await getActiveMemberCount();
  const requiredVotingParticipation = Math.ceil(totalActiveMembers * (2 / 3));

  return {
    id: amendment.id,
    title: amendment.title,
    description: amendment.description,
    status: amendment.status,
    originalContent: amendment.originalContent,
    proposedContent: amendment.proposedContent,
    githubPrNumber: amendment.githubPrNumber,
    githubBranch: amendment.githubBranch,
    isSemanticChange: amendment.isSemanticChange,
    createdAt: amendment.createdAt.toISOString(),
    updatedAt: amendment.updatedAt.toISOString(),
    publishedAt: amendment.publishedAt?.toISOString() ?? null,
    votingOpenedAt: amendment.votingOpenedAt?.toISOString() ?? null,
    votingClosedAt: amendment.votingClosedAt?.toISOString() ?? null,
    author: amendment.author,
    votes: {
      totalVotes: voteSummary.totalVotes,
      approveVotes: voteSummary.approveVotes,
      rejectVotes: voteSummary.rejectVotes,
      requiredVotingParticipation,
      quorumAchieved: voteSummary.totalVotes >= requiredVotingParticipation || requiredVotingParticipation === 0,
      requiredApproveVotes: Math.ceil(voteSummary.totalVotes * (2 / 3)),
      hasSupermajority:
        voteSummary.totalVotes > 0 && voteSummary.approveVotes >= Math.ceil(voteSummary.totalVotes * (2 / 3)),
      totalActiveMembers,
    },
    userVote: null,
    comments: amendment.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: {
        id: comment.author.id,
        name: comment.author.name,
        image: resolveUserImage(comment.author.profileImageKey, comment.author.googleImageURL),
      },
    })),
  };
}

export default async function AmendmentDetailPage({ params }: RouteParams) {
  const amendmentId = Number(params.id);
  if (Number.isNaN(amendmentId)) {
    notFound();
  }

  const amendment = await getAmendmentDetails(amendmentId);
  if (!amendment) {
    notFound();
  }

  // Determine if current user already cast a vote for this amendment
  const auth = await getAuthLevel();
  if (auth.userId) {
    const vote = await prisma.amendmentVote.findUnique({
      where: {
        amendmentId_userId: {
          amendmentId: amendment.id,
          userId: auth.userId,
        },
      },
      select: { approve: true },
    });
    amendment.userVote = vote ? vote.approve : null;
  }

  return (
    <section className="w-full px-2 md:px-4 pb-6">
      <AmendmentDetailClient amendment={amendment} />
    </section>
  );
}
