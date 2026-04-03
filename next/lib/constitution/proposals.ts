import type { AuthLevel } from "@/lib/authLevel";
import type { ConstitutionProposalComputedStatus } from "@/lib/constitution/types";
import {
  areConstitutionVoteResultsPublic,
  getConstitutionProposalComputedStatus,
  getConstitutionVoteTotals,
  getRequiredPrimaryQuorum,
} from "@/lib/constitution/status";
import { Prisma } from "@prisma/client";

export const constitutionProposalDetailInclude =
  Prisma.validator<Prisma.ConstitutionProposalInclude>()({
    author: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    primaryApprovals: {
      orderBy: { createdAt: "asc" },
      select: {
        approverOfficerId: true,
        createdAt: true,
        approverOfficer: {
          select: {
            id: true,
            user_id: true,
            position: {
              select: {
                title: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    },
    votes: {
      orderBy: { createdAt: "asc" },
      select: {
        voterId: true,
        choice: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  });

export type ConstitutionProposalDetailRecord = Prisma.ConstitutionProposalGetPayload<{
  include: typeof constitutionProposalDetailInclude;
}>;

export type ViewerPrimaryOfficerSlot = {
  id: number;
  positionTitle: string;
};

export function buildConstitutionProposalView(
  proposal: ConstitutionProposalDetailRecord,
  viewer: Pick<AuthLevel, "userId" | "isMember" | "isPrimary" | "isPresident">,
  options: {
    currentDocumentSha?: string | null;
    activePrimaryCount?: number;
    viewerPrimaryOfficerSlots?: ViewerPrimaryOfficerSlot[];
    now?: Date;
  } = {}
) {
  const computedStatus = getConstitutionProposalComputedStatus(proposal, {
    currentDocumentSha: options.currentDocumentSha,
    now: options.now,
  });
  const voteTotals = getConstitutionVoteTotals(proposal.votes);
  const resultsPublic = areConstitutionVoteResultsPublic(computedStatus);
  const activePrimaryCount = options.activePrimaryCount ?? 0;
  const quorumRequired = getRequiredPrimaryQuorum(activePrimaryCount);
  const viewerPrimaryOfficerSlots = options.viewerPrimaryOfficerSlots ?? [];
  const approvedCount = proposal.primaryApprovals.length;
  const viewerVote = proposal.votes.find((vote) => vote.voterId === viewer.userId);
  const approvalSlots = viewerPrimaryOfficerSlots.map((slot) => {
    const approval = proposal.primaryApprovals.find(
      (candidate) => candidate.approverOfficerId === slot.id
    );

    return {
      officerId: slot.id,
      positionTitle: slot.positionTitle,
      approved: Boolean(approval),
      approvedAt: approval?.createdAt ?? null,
    };
  });

  return {
    id: proposal.id,
    title: proposal.title,
    summary: proposal.summary,
    rationale: proposal.rationale,
    storedStatus: proposal.status,
    computedStatus,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
    submittedAt: proposal.submittedAt,
    electionStartsAt: proposal.electionStartsAt,
    electionEndsAt: proposal.electionEndsAt,
    appliedAt: proposal.appliedAt,
    appliedCommitSha: proposal.appliedCommitSha,
    baseDocumentSha: proposal.baseDocumentSha,
    sectionHeadingPath: proposal.sectionHeadingPath,
    proposedSectionMarkdown: proposal.proposedSectionMarkdown,
    fullProposedMarkdown: proposal.fullProposedMarkdown,
    unifiedDiff: proposal.unifiedDiff,
    author: proposal.author,
    quorum: {
      activePrimaryCount,
      required: quorumRequired,
      approvedCount,
      approvalSlots,
      approvals: proposal.primaryApprovals.map((approval) => ({
        officerId: approval.approverOfficerId,
        positionTitle: approval.approverOfficer.position.title,
        userId: approval.approverOfficer.user.id,
        approverName: approval.approverOfficer.user.name,
        createdAt: approval.createdAt,
      })),
    },
    vote: {
      canVote: viewer.isMember && computedStatus === "OPEN",
      viewerChoice: viewerVote?.choice ?? null,
      totalCount: resultsPublic ? voteTotals.yes + voteTotals.no : null,
      yesCount: resultsPublic ? voteTotals.yes : null,
      noCount: resultsPublic ? voteTotals.no : null,
      resultsPublic,
    },
    permissions: {
      canEdit:
        ((proposal.authorId === viewer.userId &&
          (proposal.status === "DRAFT" ||
            proposal.status === "PRIMARY_REVIEW")) ||
          (viewer.isPrimary && proposal.status === "PRIMARY_REVIEW")) &&
        computedStatus !== "OPEN" &&
        computedStatus !== "PASSED" &&
        computedStatus !== "FAILED" &&
        computedStatus !== "APPLIED",
      canApprove: viewer.isPrimary && proposal.status === "PRIMARY_REVIEW",
      canSchedule:
        viewer.isPrimary &&
        (proposal.status === "PRIMARY_REVIEW" || proposal.status === "SCHEDULED") &&
        computedStatus !== "STALE" &&
        computedStatus !== "PASSED" &&
        computedStatus !== "FAILED" &&
        computedStatus !== "APPLIED",
      canApply: viewer.isPresident && computedStatus === "PASSED",
    },
  };
}

export function isConstitutionProposalClosed(
  status: ConstitutionProposalComputedStatus
) {
  return status === "PASSED" || status === "FAILED" || status === "APPLIED";
}
