import prisma from "@/lib/prisma";
import { resolveUserImage } from "@/lib/s3Utils";
import { computeVoteSummary, getActiveMemberCount } from "@/lib/services/amendmentService";
import AmendmentDetailClient from "@/components/amendments/AmendmentDetailClient";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { notFound } from "next/navigation";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
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
        select: { userId: true, approve: true, phase: true, officerPositionId: true },
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

  const memberVotes = amendment.votes.filter(v => v.phase === "VOTING");
  const voteSummary = computeVoteSummary(memberVotes);
  const totalActiveMembers = await getActiveMemberCount();
  const requiredVotingParticipation = Math.ceil(totalActiveMembers * (2 / 3));

  const primaryReviewVotes = amendment.votes.filter(v => v.phase === "PRIMARY_REVIEW");

  // Build position-level primary review data
  const allPrimaryPositions = await prisma.officerPosition.findMany({
    where: { is_primary: true },
    select: {
      id: true,
      title: true,
      officers: {
        where: { is_active: true },
        select: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { title: "asc" },
  });

  const positionSlots = allPrimaryPositions.map((pos) => {
    const vote = primaryReviewVotes.find((v) => (v as { officerPositionId?: number }).officerPositionId === pos.id);
    const holder = pos.officers[0]?.user ?? null;
    return {
      positionId: pos.id,
      title: pos.title,
      holder: holder ? { id: holder.id, name: holder.name } : null,
      voted: !!vote,
      approve: vote?.approve ?? null,
    };
  });

  const totalPositions = positionSlots.length;
  const votedCount = positionSlots.filter((s) => s.voted).length;
  const approveCount = positionSlots.filter((s) => s.approve === true).length;
  const rejectCount = positionSlots.filter((s) => s.approve === false).length;
  const quorumRequired = totalPositions === 0 ? 0 : Math.floor(totalPositions / 2) + 1;
  const quorumMet = votedCount >= quorumRequired;

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
    primaryReviewOpenedAt: amendment.primaryReviewOpenedAt?.toISOString() ?? null,
    primaryReviewClosedAt: amendment.primaryReviewClosedAt?.toISOString() ?? null,
    votingDurationHours: amendment.votingDurationHours,
    votingEndsAt: amendment.votingEndsAt?.toISOString() ?? null,
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
    primaryReview: {
      positionSlots,
      totalPositions,
      votedCount,
      approveCount,
      rejectCount,
      quorumRequired,
      quorumMet,
      majorityApproves: quorumMet && approveCount > rejectCount,
      majorityRejects: quorumMet && rejectCount >= approveCount,
    },
    userVote: null as boolean | null,
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
  const { id } = await params;
  const amendmentId = Number(id);
  if (Number.isNaN(amendmentId)) {
    notFound();
  }

  const amendment = await getAmendmentDetails(amendmentId);
  if (!amendment) {
    notFound();
  }

  // Determine if current user already cast a member vote
  const auth = await getAuthLevel();
  if (auth.userId) {
    const vote = await prisma.amendmentVote.findFirst({
      where: { amendmentId: amendment.id, userId: auth.userId, phase: "VOTING" },
      select: { approve: true },
    });
    amendment.userVote = vote ? vote.approve : null;
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-2 md:px-4 pb-6">
      <AmendmentDetailClient amendment={amendment} />
    </section>
  );
}
