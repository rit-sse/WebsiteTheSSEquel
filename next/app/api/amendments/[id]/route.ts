import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import {
  computeVoteSummary,
  getActiveMemberCount,
  getActorFromRequest,
} from "@/lib/services/amendmentService";
import {
  buildAmendmentBranchName,
  createAmendmentPR,
  fetchConstitutionSnapshot,
} from "@/lib/services/githubAmendmentService";

export const dynamic = "force-dynamic";

function sanitizeStatus(value: string | null): AmendmentStatus | null {
  if (!value) return null;

  const candidate = value.toUpperCase();
  if (candidate in AmendmentStatus) {
    return candidate as AmendmentStatus;
  }
  return null;
}

function parseVotingDurationHours(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    value < 1 ||
    value > 336
  ) {
    return null;
  }
  return value;
}

function sanitizeText(input: unknown): string | null {
  if (typeof input !== "string") return null;
  return input.trim();
}

function canEditAmendmentContent(
  actor: { isPrimary: boolean; isSeAdmin: boolean; id: number } | null,
  amendment: { authorId: number; status: AmendmentStatus },
) {
  if (!actor) {
    return false;
  }

  if (amendment.status !== "PRIMARY_REVIEW") {
    return false;
  }

  return actor.isPrimary || actor.isSeAdmin || amendment.authorId === actor.id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const amendmentId = Number(id);
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
        select: {
          id: true,
          userId: true,
          approve: true,
          phase: true,
          officerPositionId: true,
          createdAt: true,
        },
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

  // Partition votes by phase
  const memberVotes = amendment.votes.filter((v) => v.phase === "VOTING");
  const primaryReviewVotes = amendment.votes.filter(
    (v) => v.phase === "PRIMARY_REVIEW",
  );

  // Member vote summary (VOTING phase only)
  const voteSummary = computeVoteSummary(memberVotes);
  const totalActiveMembers = await getActiveMemberCount();
  const requiredVotingParticipation = Math.ceil(totalActiveMembers * (2 / 3));
  const quorumAchieved =
    voteSummary.totalVotes >= requiredVotingParticipation ||
    requiredVotingParticipation === 0;
  const approvingVotesRequired = Math.ceil(voteSummary.totalVotes * (2 / 3));
  const hasSupermajority =
    voteSummary.totalVotes > 0 &&
    voteSummary.approveVotes >= approvingVotesRequired;

  // User's member vote
  const userVote = actor?.id
    ? (memberVotes.find((vote) => vote.userId === actor.id)?.approve ?? null)
    : null;

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
    const vote = primaryReviewVotes.find(
      (v) =>
        v.phase === "PRIMARY_REVIEW" &&
        (v as { officerPositionId?: number }).officerPositionId === pos.id,
    );
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
  const quorumRequired =
    totalPositions === 0 ? 0 : Math.floor(totalPositions / 2) + 1;
  const quorumMet = votedCount >= quorumRequired;

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
    primaryReviewOpenedAt: amendment.primaryReviewOpenedAt,
    primaryReviewClosedAt: amendment.primaryReviewClosedAt,
    votingOpenedAt: amendment.votingOpenedAt,
    votingClosedAt: amendment.votingClosedAt,
    votingDurationHours: amendment.votingDurationHours,
    votingEndsAt: amendment.votingEndsAt,
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
    userVote,
    comments: amendment.comments,
  });
}

function canChangeStatus(
  actor: { isPrimary: boolean; isSeAdmin: boolean; id: number } | null,
  amendment: { authorId: number },
  requestedStatus: AmendmentStatus,
) {
  if (!actor) {
    return false;
  }

  // SE Admin can only perform the final merge (APPROVED → MERGED is handled by merge route)
  // and withdraw amendments
  if (requestedStatus === "WITHDRAWN") {
    return (
      actor.isPrimary || actor.isSeAdmin || amendment.authorId === actor.id
    );
  }

  // All other status transitions require primary officer
  return actor.isPrimary;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const amendmentId = Number(id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const actor = await getActorFromRequest(request);
  let body: {
    status?: string;
    votingDurationHours?: number;
    resetVotingWindowFromNow?: boolean;
    title?: unknown;
    description?: unknown;
    proposedContent?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const requestedStatus = body.status
    ? sanitizeStatus(body.status ?? null)
    : null;
  if (body.status && !requestedStatus) {
    return new Response("Invalid status value", { status: 422 });
  }

  const nextTitle = sanitizeText(body.title);
  const nextDescription = sanitizeText(body.description);
  const nextProposedContent = sanitizeText(body.proposedContent);
  const wantsContentEdit =
    nextTitle !== null ||
    nextDescription !== null ||
    nextProposedContent !== null;

  if (!requestedStatus && !wantsContentEdit) {
    return new Response("Provide a valid status change or amendment edits", {
      status: 422,
    });
  }

  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    select: {
      id: true,
      status: true,
      authorId: true,
      title: true,
      description: true,
      proposedContent: true,
      githubPrNumber: true,
      publishedAt: true,
      votingOpenedAt: true,
    },
  });
  if (!amendment) {
    return new Response("Amendment not found", { status: 404 });
  }

  if (
    requestedStatus &&
    !canChangeStatus(actor ?? null, amendment, requestedStatus)
  ) {
    return new Response(
      "Only primary officers, SE admins, or the author may update this amendment",
      { status: 403 },
    );
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {};

  if (wantsContentEdit) {
    if (!canEditAmendmentContent(actor ?? null, amendment)) {
      return new Response(
        "Only the author, a primary officer, or an SE admin can edit this amendment during quorum.",
        { status: 403 },
      );
    }

    if (nextTitle !== null) {
      if (!nextTitle) {
        return new Response("title cannot be empty", { status: 422 });
      }
      updateData.title = nextTitle;
    }

    if (nextDescription !== null) {
      updateData.description = nextDescription;
    }

    if (nextProposedContent !== null) {
      if (!nextProposedContent) {
        return new Response("proposedContent cannot be empty", { status: 422 });
      }
      updateData.proposedContent = nextProposedContent;
    }

    try {
      const snapshot = await fetchConstitutionSnapshot();
      updateData.originalContent = snapshot.content;
    } catch {
      // Keep the existing baseline if GitHub is unavailable while editing.
    }
  }

  if (requestedStatus) {
    updateData.status = requestedStatus;
  }

  if (requestedStatus === "OPEN" && amendment.status !== "OPEN") {
    updateData.publishedAt = now;
  }

  // DRAFT/OPEN → PRIMARY_REVIEW
  if (
    requestedStatus === "PRIMARY_REVIEW" &&
    amendment.status !== "PRIMARY_REVIEW"
  ) {
    updateData.primaryReviewOpenedAt = now;
    if (!amendment.publishedAt) {
      updateData.publishedAt = now;
    }
  }

  // PRIMARY_REVIEW → VOTING (requires position-level quorum + majority approval + voting duration)
  if (requestedStatus === "VOTING" && amendment.status === "PRIMARY_REVIEW") {
    const primaryVotes = await prisma.amendmentVote.findMany({
      where: {
        amendmentId,
        phase: "PRIMARY_REVIEW",
        officerPositionId: { not: null },
      },
      select: { approve: true },
    });
    const totalPositions = await prisma.officerPosition.count({
      where: { is_primary: true },
    });
    const votedCount = primaryVotes.length;
    const approveCount = primaryVotes.filter((v) => v.approve).length;
    const rejectCount = votedCount - approveCount;
    const quorumRequired =
      totalPositions === 0 ? 0 : Math.floor(totalPositions / 2) + 1;
    const quorumMet = votedCount >= quorumRequired;
    const majorityApproves = quorumMet && approveCount > rejectCount;

    if (!majorityApproves) {
      return new Response(
        "Cannot open member voting: primary officers have not approved this amendment.",
        { status: 409 },
      );
    }

    const hours = parseVotingDurationHours(body.votingDurationHours);
    if (hours === null) {
      return new Response(
        "votingDurationHours must be a number between 1 and 336.",
        { status: 422 },
      );
    }

    updateData.primaryReviewClosedAt = now;
    updateData.votingOpenedAt = now;
    updateData.votingDurationHours = hours;
    updateData.votingEndsAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    if (!amendment.githubPrNumber) {
      const branchName = buildAmendmentBranchName(amendment.title, amendment.id);
      const proposedBy = `Member #${amendment.authorId}`;
      const prBody =
        amendment.description ||
        `${amendment.title}\n\nAmendment proposal by ${proposedBy}.`;

      try {
        const { prNumber, originalContent } = await createAmendmentPR({
          title: amendment.title,
          description: prBody,
          proposedContent:
            (typeof updateData.proposedContent === "string"
              ? updateData.proposedContent
              : amendment.proposedContent) ?? amendment.proposedContent,
          proposedBy,
          branchName,
        });

        updateData.githubBranch = branchName;
        updateData.githubPrNumber = prNumber;
        updateData.originalContent = originalContent;
      } catch {
        try {
          const snapshot = await fetchConstitutionSnapshot();
          updateData.originalContent = snapshot.content;
        } catch {
          // Keep the current baseline if GitHub is unavailable.
        }
        updateData.prCreationWarning =
          "Member voting opened, but the GitHub PR could not be created. Use Create PR to retry.";
      }
    }
  }

  // VOTING → VOTING (edit the existing voting window without changing status)
  if (requestedStatus === "VOTING" && amendment.status === "VOTING") {
    const hours = parseVotingDurationHours(body.votingDurationHours);
    if (hours === null) {
      return new Response(
        "votingDurationHours must be a number between 1 and 336.",
        { status: 422 },
      );
    }

    const baseTime = body.resetVotingWindowFromNow
      ? now
      : (amendment.votingOpenedAt ?? now);
    updateData.votingDurationHours = hours;
    updateData.votingEndsAt = new Date(
      baseTime.getTime() + hours * 60 * 60 * 1000,
    );
    updateData.votingClosedAt = null;
  }

  // PRIMARY_REVIEW → REJECTED (requires position-level quorum + majority rejection)
  if (requestedStatus === "REJECTED" && amendment.status === "PRIMARY_REVIEW") {
    const primaryVotes = await prisma.amendmentVote.findMany({
      where: {
        amendmentId,
        phase: "PRIMARY_REVIEW",
        officerPositionId: { not: null },
      },
      select: { approve: true },
    });
    const totalPositions = await prisma.officerPosition.count({
      where: { is_primary: true },
    });
    const votedCount = primaryVotes.length;
    const approveCount = primaryVotes.filter((v) => v.approve).length;
    const rejectCount = votedCount - approveCount;
    const quorumRequired =
      totalPositions === 0 ? 0 : Math.floor(totalPositions / 2) + 1;
    const quorumMet = votedCount >= quorumRequired;
    const majorityRejects = quorumMet && rejectCount >= approveCount;

    if (!majorityRejects) {
      return new Response(
        "Cannot reject: primary officers have not reached quorum or do not have a rejection majority.",
        { status: 409 },
      );
    }

    updateData.primaryReviewClosedAt = now;
    updateData.votingClosedAt = now;
  }

  // VOTING → APPROVED/REJECTED
  if (
    (requestedStatus === "APPROVED" || requestedStatus === "REJECTED") &&
    amendment.status === "VOTING"
  ) {
    updateData.votingClosedAt = now;
  }

  const prCreationWarning =
    typeof updateData.prCreationWarning === "string"
      ? (updateData.prCreationWarning as string)
      : null;
  delete updateData.prCreationWarning;

  const updated = await prisma.amendment.update({
    where: { id: amendmentId },
    data: updateData,
  });

  return Response.json({
    ...updated,
    prCreationWarning,
  });
}
