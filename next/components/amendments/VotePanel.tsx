"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import VotePieChart from "@/components/amendments/VotePieChart";
import VotingDurationDialog from "@/components/amendments/VotingDurationDialog";
import ConfirmationDialog from "@/components/amendments/ConfirmationDialog";
import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { AmendmentStatus } from "@prisma/client";

type VotePanelProps = {
  amendmentId: number;
  isSemanticChange: boolean;
  status: "DRAFT" | "OPEN" | "PRIMARY_REVIEW" | "VOTING" | "APPROVED" | "REJECTED" | "MERGED" | "WITHDRAWN";
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
  requiredVotingParticipation: number;
  totalActiveMembers: number;
  userVote: boolean | null;
  /** Whether the viewer is a signed-in active member who can cast votes. */
  isMember?: boolean;
  /** Whether the viewer is signed in at all. */
  isUser?: boolean;
  primaryReview?: {
    positionSlots: {
      positionId: number;
      title: string;
      holder: { id: number; name: string | null } | null;
      voted: boolean;
      approve: boolean | null;
    }[];
    totalPositions: number;
    votedCount: number;
    approveCount: number;
    rejectCount: number;
    quorumRequired: number;
    quorumMet: boolean;
    majorityApproves: boolean;
    majorityRejects: boolean;
  } | null;
  votingEndsAt?: string | null;
  isPrimary?: boolean;
  isSeAdmin?: boolean;
  /** The position IDs held by the current user (for per-position voting) */
  userPrimaryPositionIds?: number[];
  /** Admin action callbacks */
  onChangeStatus?: (s: AmendmentStatus, extraData?: Record<string, unknown>) => void;
  onMerge?: () => void;
  actionMessage?: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function statusHeadline(status: VotePanelProps["status"]) {
  switch (status) {
    case "DRAFT":
      return "Draft — not yet open";
    case "OPEN":
      return "Open for public forum";
    case "PRIMARY_REVIEW":
      return "Primary officer review";
    case "VOTING":
      return "Voting is live";
    case "APPROVED":
      return "Amendment approved";
    case "REJECTED":
      return "Amendment rejected";
    case "MERGED":
      return "Merged into constitution";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return "";
  }
}

function statusDescription(status: VotePanelProps["status"]) {
  switch (status) {
    case "DRAFT":
      return "This amendment is still being drafted and is not yet visible for voting.";
    case "OPEN":
      return "The amendment is open for community discussion. Voting has not started.";
    case "PRIMARY_REVIEW":
      return "Primary officers are reviewing this amendment. A majority must approve before it moves to a general membership vote.";
    case "VOTING":
      return "Active members may cast their vote. A 2/3 quorum of active members must participate, and a 2/3 supermajority of cast votes must approve.";
    case "APPROVED":
      return "The vote passed. A primary officer will merge the changes into the constitution.";
    case "REJECTED":
      return "The amendment did not meet the required approval thresholds and has been rejected.";
    case "MERGED":
      return "This amendment has been merged into the official governing documents.";
    case "WITHDRAWN":
      return "The proposer or a primary officer withdrew this amendment.";
    default:
      return "";
  }
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
      : `Need ${requiredVotingParticipation - totalVotes} more vote${requiredVotingParticipation - totalVotes !== 1 ? "s" : ""} for quorum (2/3 of ${totalActiveMembers}).`,
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function ThresholdBar({
  label,
  tooltip,
  current,
  required,
  met,
  colorVar,
}: {
  label: string;
  tooltip: string;
  current: number;
  required: number;
  met: boolean;
  colorVar: string;
}) {
  const pct = required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 100;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1 cursor-help">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-medium text-foreground">
                {label}
                {met ? (
                  <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">
                    &#10003;
                  </span>
                ) : null}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {current} / {required}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: `hsl(var(${colorVar}))` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function VoteLegendItem({
  cssVar,
  label,
  value,
  pct,
  tooltip,
}: {
  cssVar: string;
  label: string;
  value: number;
  pct: number;
  tooltip?: string;
}) {
  const inner = (
    <div className={`flex items-center gap-2 text-sm ${tooltip ? "cursor-help" : ""}`}>
      <span
        className="inline-block h-3 w-3 rounded-sm shrink-0"
        style={{ backgroundColor: `hsl(var(${cssVar}))` }}
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto tabular-nums font-semibold">
        {value}
        <span className="text-xs text-muted-foreground font-normal ml-1">
          ({pct}%)
        </span>
      </span>
    </div>
  );

  if (!tooltip) return inner;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

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
  isMember = false,
  isUser = false,
  primaryReview = null,
  votingEndsAt = null,
  isSeAdmin = false,
  userPrimaryPositionIds = [],
  onChangeStatus,
  onMerge,
  actionMessage,
  isPrimary = false,
}: VotePanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [localUserVote, setLocalUserVote] = useState<boolean | null>(userVote);
  const [localTotals, setLocalTotals] = useState({
    totalVotes,
    approveVotes,
    rejectVotes,
  });
  const [localPrimaryReview, setLocalPrimaryReview] = useState(primaryReview);

  const votingWindowEnded = votingEndsAt ? new Date(votingEndsAt).getTime() < Date.now() : false;
  const canVote = status === "VOTING" && !votingWindowEnded;
  const notVoted = Math.max(0, totalActiveMembers - localTotals.totalVotes);
  const totalForPct = localTotals.totalVotes || 1;
  const approvePct = Math.round((localTotals.approveVotes / totalForPct) * 100);
  const rejectPct = Math.round((localTotals.rejectVotes / totalForPct) * 100);
  const notVotedPct =
    totalActiveMembers > 0
      ? Math.round((notVoted / totalActiveMembers) * 100)
      : 0;

  const outcome = useMemo(
    () =>
      canPassAmendment({
        isSemanticChange,
        totalVotes: localTotals.totalVotes,
        approveVotes: localTotals.approveVotes,
        requiredVotingParticipation,
        totalActiveMembers,
      }),
    [
      isSemanticChange,
      localTotals.totalVotes,
      localTotals.approveVotes,
      requiredVotingParticipation,
      totalActiveMembers,
    ],
  );

  const requiredApproveVotes = Math.ceil((2 / 3) * localTotals.totalVotes);

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
        approveVotes:
          payload?.voteSummary?.approveVotes ?? localTotals.approveVotes,
        rejectVotes:
          payload?.voteSummary?.rejectVotes ?? localTotals.rejectVotes,
      });
      setLocalUserVote(approve);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not record vote");
    } finally {
      setSubmitting(false);
    }
  }

  async function castPositionVote(positionId: number, approve: boolean) {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/amendments/${amendmentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve, officerPositionId: positionId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? payload ?? "Could not record vote");
      }
      if (payload.primaryReview) {
        setLocalPrimaryReview(payload.primaryReview);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not record vote");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card depth={2} className="p-5 space-y-5 overflow-hidden">
      {/* Header */}
      <CardHeader className="p-0 space-y-1">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full shrink-0 ${
              canVote
                ? "bg-emerald-500 animate-pulse"
                : status === "APPROVED" || status === "MERGED"
                  ? "bg-emerald-500"
                  : status === "REJECTED"
                    ? "bg-rose-500"
                    : "bg-muted-foreground/40"
            }`}
          />
          <CardTitle className="text-lg">{statusHeadline(status)}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {statusDescription(status)}
        </p>
      </CardHeader>

      {/* PRIMARY_REVIEW — nuclear key-slot panel */}
      {status === "PRIMARY_REVIEW" && localPrimaryReview && (
        <div className="space-y-4">
          {/* Quorum bar */}
          <ThresholdBar
            label="Officer Quorum"
            tooltip={`${localPrimaryReview.votedCount} of ${localPrimaryReview.quorumRequired} required positions have voted (${localPrimaryReview.totalPositions} total).`}
            current={localPrimaryReview.votedCount}
            required={localPrimaryReview.quorumRequired}
            colorVar="--ring"
            met={localPrimaryReview.quorumMet}
          />

          {/* Position key slots */}
          <div className="space-y-2">
            {localPrimaryReview.positionSlots.map((slot) => {
              const isMyPosition = userPrimaryPositionIds.includes(slot.positionId);
              const canActOnSlot = isMyPosition && !slot.voted;
              const hasVoted = slot.voted;

              return (
                <div
                  key={slot.positionId}
                  className={`rounded-lg border px-3 py-2.5 transition-all ${
                    hasVoted
                      ? slot.approve
                        ? "border-emerald-500/40 bg-emerald-500/8"
                        : "border-rose-500/40 bg-rose-500/8"
                      : isMyPosition
                        ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/40 bg-surface-3/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div
                      className={`h-3 w-3 rounded-full shrink-0 transition-colors ${
                        hasVoted
                          ? slot.approve
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                          : isMyPosition
                            ? "bg-primary/40 animate-pulse"
                            : "bg-muted-foreground/20"
                      }`}
                    />

                    {/* Position info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {slot.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {slot.holder?.name ?? "Vacant"}
                        {hasVoted && (
                          <span className={`ml-1.5 font-medium ${
                            slot.approve
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}>
                            — {slot.approve ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Action buttons for positions the current user holds */}
                    {isMyPosition && (
                      <div className="flex gap-1.5 shrink-0">
                        {hasVoted ? (
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            slot.approve
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-rose-700 dark:text-rose-300"
                          }`}>
                            {slot.approve ? "Approved" : "Rejected"}
                          </span>
                        ) : (
                          <>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={submitting}
                              className="text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 h-7 px-2"
                              onClick={() => castPositionVote(slot.positionId, true)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={submitting}
                              className="text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/10 h-7 px-2"
                              onClick={() => castPositionVote(slot.positionId, false)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Waiting indicator for other positions */}
                    {!isMyPosition && !hasVoted && (
                      <span className="text-xs text-muted-foreground/60 italic shrink-0">
                        Awaiting
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary counts */}
          <div className="flex gap-4 text-xs text-muted-foreground pt-1 border-t border-border/30">
            <span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {localPrimaryReview.approveCount}
              </span>{" "}
              approved
            </span>
            <span>
              <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                {localPrimaryReview.rejectCount}
              </span>{" "}
              rejected
            </span>
            <span className="ml-auto">
              <span className="tabular-nums">{localPrimaryReview.votedCount}</span>
              {" / "}
              <span className="tabular-nums">{localPrimaryReview.totalPositions}</span>
              {" "}voted
            </span>
          </div>
        </div>
      )}

      {/* Non-semantic info banner */}
      {status !== "PRIMARY_REVIEW" && !isSemanticChange && canVote && (
        <div className="rounded-lg bg-sky-500/8 border border-sky-500/20 px-3 py-2 text-xs text-sky-700 dark:text-sky-300">
          Non-semantic changes require primary officer consensus. Only primary officers vote on this type.
        </div>
      )}

      {/* Voting countdown */}
      {canVote && votingEndsAt && (() => {
        const remaining = new Date(votingEndsAt).getTime() - Date.now();
        if (remaining <= 0) {
          return (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
              Voting window has ended
            </div>
          );
        }
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
            {days > 0 ? `${days} day${days !== 1 ? "s" : ""}, ` : ""}{hours} hour{hours !== 1 ? "s" : ""} remaining
          </div>
        );
      })()}

      {/* Pie chart + legend */}
      {status !== "PRIMARY_REVIEW" && (
        <CardContent className="p-0">
          <div className="flex flex-col items-center gap-4">
            <VotePieChart
              approve={localTotals.approveVotes}
              reject={localTotals.rejectVotes}
              notVoted={notVoted}
              size={180}
              strokeWidth={28}
            />

            <div className="w-full space-y-1.5">
              <VoteLegendItem
                cssVar="--vote-approve"
                label="Approve"
                value={localTotals.approveVotes}
                pct={localTotals.totalVotes > 0 ? approvePct : 0}
              />
              <VoteLegendItem
                cssVar="--vote-reject"
                label="Reject"
                value={localTotals.rejectVotes}
                pct={localTotals.totalVotes > 0 ? rejectPct : 0}
              />
              <VoteLegendItem
                cssVar="--vote-not-voted"
                label="Not voted"
                value={notVoted}
                pct={notVotedPct}
                tooltip="Members who haven't voted yet. They may still participate while voting is open."
              />
            </div>
          </div>
        </CardContent>
      )}

      {/* Threshold bars */}
      {status !== "PRIMARY_REVIEW" && isSemanticChange && (
        <div className="space-y-3 pt-1">
          <ThresholdBar
            label="Quorum"
            tooltip={`${localTotals.totalVotes} of ${totalActiveMembers} active members have voted. 2/3 quorum requires ${requiredVotingParticipation} votes.`}
            current={localTotals.totalVotes}
            required={requiredVotingParticipation}
            colorVar="--ring"
            met={outcome.hasQuorum}
          />
          <ThresholdBar
            label="Supermajority"
            tooltip={`${localTotals.approveVotes} of ${localTotals.totalVotes} cast votes are approvals. 2/3 supermajority requires ${requiredApproveVotes} approve votes.`}
            current={localTotals.approveVotes}
            required={requiredApproveVotes}
            colorVar="--vote-approve"
            met={outcome.hasMajority}
          />
        </div>
      )}

      {/* Vote action area — role-gated */}
      {canVote && (
        <div className="space-y-3 pt-1 border-t border-border/40">
          {isMember ? (
            <>
              <p className="text-sm font-medium pt-3">
                {localUserVote === null
                  ? "Cast your vote"
                  : localUserVote
                    ? "You voted to approve"
                    : "You voted to reject"}
              </p>
              <div className="flex gap-2">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={submitting}
                        variant={localUserVote === true ? "default" : "outline"}
                        className={
                          localUserVote === true
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
                            : ""
                        }
                        onClick={() => castVote(true)}
                      >
                        {localUserVote === true ? "Approved" : "Approve"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{localUserVote === true ? "You approved this amendment. Click to re-confirm." : "Vote to approve this amendment"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={submitting}
                        variant={localUserVote === false ? "destructive" : "outline"}
                        onClick={() => castVote(false)}
                      >
                        {localUserVote === false ? "Rejected" : "Reject"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{localUserVote === false ? "You rejected this amendment. Click to re-confirm." : "Vote to reject this amendment"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {localUserVote !== null && (
                <p className="text-xs text-muted-foreground">
                  You can change your vote while voting is open.
                </p>
              )}
            </>
          ) : isUser ? (
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground/60" />
                <p className="text-sm font-medium text-muted-foreground">
                  Become a member to vote
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Only active SSE members can participate in amendment votes.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/memberships">Learn About Membership</Link>
              </Button>
            </div>
          ) : (
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-muted-foreground/60" />
                <p className="text-sm font-medium text-muted-foreground">
                  Sign in to vote
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Only active SSE members can participate in amendment votes.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/auth/signin">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Outcome badge for closed votes */}
      {(status === "APPROVED" || status === "REJECTED" || status === "MERGED") && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            status === "REJECTED"
              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {status === "REJECTED"
            ? "This amendment did not receive sufficient approval."
            : status === "MERGED"
              ? "Successfully merged into the governing documents."
              : "Approved — awaiting merge by a primary officer."}
        </div>
      )}

      {/* Admin actions — inline */}
      {onChangeStatus && (
        <>
          {/* PRIMARY_REVIEW: open voting or reject */}
          {status === "PRIMARY_REVIEW" && localPrimaryReview && isPrimary && (
            <div className="space-y-2 pt-1 border-t border-border/40">
              {localPrimaryReview.majorityApproves && (
                <VotingDurationDialog
                  trigger={
                    <Button size="sm" className="w-full">Open Member Voting</Button>
                  }
                  onConfirm={(hours) => onChangeStatus("VOTING" as AmendmentStatus, { votingDurationHours: hours })}
                />
              )}
              {localPrimaryReview.majorityRejects && (
                <ConfirmationDialog
                  trigger={
                    <Button size="sm" variant="destructive" className="w-full">Close as Rejected</Button>
                  }
                  title="Reject Amendment"
                  description="Primary officers have rejected this amendment."
                  confirmLabel="Reject"
                  variant="destructive"
                  onConfirm={() => onChangeStatus("REJECTED" as AmendmentStatus)}
                />
              )}
            </div>
          )}

          {/* VOTING: approve or reject (after window ends) */}
          {status === "VOTING" && isPrimary && votingWindowEnded && (
            <div className="flex gap-2 pt-1 border-t border-border/40">
              <ConfirmationDialog
                trigger={
                  <Button size="sm" className="flex-1">Approve</Button>
                }
                title="Approve Amendment"
                description="This will approve the amendment and close voting."
                confirmLabel="Approve"
                onConfirm={() => onChangeStatus("APPROVED" as AmendmentStatus)}
              />
              <ConfirmationDialog
                trigger={
                  <Button size="sm" variant="destructive" className="flex-1">Reject</Button>
                }
                title="Reject Amendment"
                description="This will reject the amendment."
                confirmLabel="Reject"
                variant="destructive"
                onConfirm={() => onChangeStatus("REJECTED" as AmendmentStatus)}
              />
            </div>
          )}

          {/* APPROVED: merge */}
          {status === "APPROVED" && (isPrimary || isSeAdmin) && onMerge && (
            <div className="pt-1 border-t border-border/40">
              <ConfirmationDialog
                trigger={
                  <Button size="sm" className="w-full">Merge into Constitution</Button>
                }
                title="Merge Pull Request"
                description="This will merge the amendment into the governing documents."
                confirmLabel="Merge"
                onConfirm={onMerge}
              />
            </div>
          )}

          {actionMessage && (
            <p className="text-xs text-destructive">{actionMessage}</p>
          )}
        </>
      )}
    </Card>
  );
}
