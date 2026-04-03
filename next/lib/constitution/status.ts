import { ConstitutionProposalStatus } from "@prisma/client";
import type { ConstitutionProposalComputedStatus } from "@/lib/constitution/types";

type VoteLike = {
  choice: string;
};

type ProposalLike = {
  status: ConstitutionProposalStatus;
  baseDocumentSha: string;
  electionStartsAt: Date | null;
  electionEndsAt: Date | null;
  appliedAt: Date | null;
  votes: VoteLike[];
};

export function getConstitutionVoteTotals(votes: VoteLike[]) {
  return votes.reduce(
    (acc, vote) => {
      const normalized = vote.choice.toUpperCase();
      if (normalized === "YES") acc.yes += 1;
      if (normalized === "NO") acc.no += 1;
      return acc;
    },
    { yes: 0, no: 0 }
  );
}

export function getRequiredPrimaryQuorum(activePrimaryCount: number) {
  return activePrimaryCount > 0 ? Math.floor(activePrimaryCount / 2) + 1 : 0;
}

export function areConstitutionVoteResultsPublic(
  status: ConstitutionProposalComputedStatus
) {
  return status === "PASSED" || status === "FAILED" || status === "APPLIED";
}

export function getConstitutionProposalComputedStatus(
  proposal: ProposalLike,
  options?: { currentDocumentSha?: string | null; now?: Date }
): ConstitutionProposalComputedStatus {
  const now = options?.now ?? new Date();
  const currentDocumentSha = options?.currentDocumentSha ?? null;
  const isStale =
    proposal.status === ConstitutionProposalStatus.STALE ||
    (!!currentDocumentSha && proposal.baseDocumentSha !== currentDocumentSha);

  if (proposal.status === ConstitutionProposalStatus.APPLIED || proposal.appliedAt) {
    return "APPLIED";
  }

  if (proposal.status === ConstitutionProposalStatus.WITHDRAWN) {
    return "WITHDRAWN";
  }

  if (isStale) {
    return "STALE";
  }

  if (proposal.status === ConstitutionProposalStatus.DRAFT) {
    return "DRAFT";
  }

  if (proposal.status === ConstitutionProposalStatus.PRIMARY_REVIEW) {
    return "PRIMARY_REVIEW";
  }

  if (!proposal.electionStartsAt || !proposal.electionEndsAt) {
    return "SCHEDULED";
  }

  if (now < proposal.electionStartsAt) {
    return "SCHEDULED";
  }

  if (now <= proposal.electionEndsAt) {
    return "OPEN";
  }

  const totals = getConstitutionVoteTotals(proposal.votes);
  return totals.yes > totals.no ? "PASSED" : "FAILED";
}
