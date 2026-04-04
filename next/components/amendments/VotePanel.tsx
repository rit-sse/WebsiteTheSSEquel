"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type VotePanelProps = {
  amendmentId: number;
  isSemanticChange: boolean;
  status: "DRAFT" | "OPEN" | "VOTING" | "APPROVED" | "REJECTED" | "MERGED" | "WITHDRAWN";
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
  requiredVotingParticipation: number;
  totalActiveMembers: number;
  userVote: boolean | null;
};

function statusCopy(status: VotePanelProps["status"]) {
  if (status === "OPEN") return "Draft is open for public forum comments and moderation.";
  if (status === "VOTING") return "Voting is live. Select Approve or Reject.";
  return "Voting is closed for this amendment.";
}

function canPassAmendment({
  isSemanticChange,
  totalVotes,
  approveVotes,
  requiredVotingParticipation,
  totalActiveMembers,
}: {
  isSemanticChange: boolean;
  totalVotes: number;
  approveVotes: number;
  requiredVotingParticipation: number;
  totalActiveMembers: number;
}) {
  const hasQuorum = totalVotes >= requiredVotingParticipation;
  const hasSuperMajority = totalVotes > 0 && approveVotes >= Math.ceil((2 / 3) * totalVotes);

  if (!isSemanticChange) {
    return {
      hasQuorum: true,
      hasMajority: hasQuorum || totalActiveMembers === 0,
      statusText: "Primary officer consensus required.",
    };
  }

  return {
    hasQuorum,
    hasMajority: hasSuperMajority,
    statusText: hasQuorum
      ? `Quorum reached (${requiredVotingParticipation} required).`
      : `Need ${
          requiredVotingParticipation - totalVotes
        } more votes for quorum (2/3 of ${totalActiveMembers}).`,
  };
}

export default function VotePanel({
  amendmentId,
  isSemanticChange,
  status,
  totalVotes,
  approveVotes,
  rejectVotes,
  requiredVotingParticipation,
  totalActiveMembers,
  userVote,
}: VotePanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [localUserVote, setLocalUserVote] = useState<boolean | null>(userVote);
  const [localTotals, setLocalTotals] = useState({
    totalVotes,
    approveVotes,
    rejectVotes,
  });
  const canVote = status === "VOTING";

  const outcome = useMemo(
    () =>
      canPassAmendment({
        isSemanticChange,
        totalVotes: localTotals.totalVotes,
        approveVotes: localTotals.approveVotes,
        requiredVotingParticipation,
        totalActiveMembers,
      }),
    [isSemanticChange, localTotals.totalVotes, localTotals.approveVotes, requiredVotingParticipation, totalActiveMembers],
  );

  const quorumProgress = requiredVotingParticipation
    ? Math.min(100, Math.round((localTotals.totalVotes / requiredVotingParticipation) * 100))
    : 100;

  const supermajorityProgress = localTotals.totalVotes
    ? Math.min(
        100,
        Math.round((localTotals.approveVotes / localTotals.totalVotes) * 100),
      )
    : 0;

  async function castVote(approve: boolean) {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/amendments/${amendmentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? payload ?? "Could not record vote");
      }

      setLocalTotals({
        totalVotes: payload?.voteSummary?.totalVotes ?? localTotals.totalVotes,
        approveVotes: payload?.voteSummary?.approveVotes ?? localTotals.approveVotes,
        rejectVotes: payload?.voteSummary?.rejectVotes ?? localTotals.rejectVotes,
      });
      setLocalUserVote(approve);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not record vote");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canVote) {
    return (
      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="font-semibold">{statusCopy(status)}</p>
        <p className="text-sm text-muted-foreground">Current result: {approveVotes} approve / {rejectVotes} reject.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <p className="font-semibold">Vote now</p>
      <p className="text-sm text-muted-foreground">{statusCopy(status)}</p>

      <div className="space-y-2">
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full bg-emerald-500/80"
            style={{ width: `${supermajorityProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Supermajority progress: {localTotals.approveVotes} / {Math.ceil((2 / 3) * localTotals.totalVotes)} approve votes
        </p>
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full bg-foreground/30"
            style={{ width: `${quorumProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Quorum progress: {localTotals.totalVotes} / {requiredVotingParticipation} votes cast
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={submitting}
          variant={localUserVote === true ? "default" : "outline"}
          onClick={() => castVote(true)}
        >
          Approve
        </Button>
        <Button
          disabled={submitting}
          variant={localUserVote === false ? "destructive" : "outline"}
          onClick={() => castVote(false)}
        >
          Reject
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{outcome.statusText}</p>
      <p className="text-sm">
        {outcome.hasMajority ? "Consensus condition satisfied." : "Waiting for sufficient participation."}
      </p>
    </div>
  );
}
