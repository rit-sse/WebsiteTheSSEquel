"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NeoCard } from "@/components/ui/neo-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadixTooltip as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DiffViewer from "@/components/amendments/DiffViewer";
import VotePanel from "@/components/amendments/VotePanel";
import CommentThread from "@/components/amendments/CommentThread";
import AmendmentStatusBadge from "@/components/amendments/AmendmentStatusBadge";
import AmendmentBreadcrumb from "@/components/amendments/AmendmentBreadcrumb";
import AmendmentTimeline from "@/components/amendments/AmendmentTimeline";
import ConfirmationDialog from "@/components/amendments/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import AmendmentDetailSkeleton from "@/components/amendments/AmendmentDetailSkeleton";
import { AmendmentStatus } from "@prisma/client";

type CommentItem = {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    name: string | null;
    image: string | null;
  };
};

type AmendmentPayload = {
  id: number;
  title: string;
  description: string;
  status: AmendmentStatus;
  originalContent: string;
  proposedContent: string;
  githubPrNumber: number | null;
  githubBranch: string | null;
  isSemanticChange: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  votingOpenedAt: string | null;
  votingClosedAt: string | null;
  primaryReviewOpenedAt: string | null;
  primaryReviewClosedAt: string | null;
  votingDurationHours: number | null;
  votingEndsAt: string | null;
  author: {
    id: number;
    name: string | null;
  };
  votes: {
    totalVotes: number;
    approveVotes: number;
    rejectVotes: number;
    requiredVotingParticipation: number;
    quorumAchieved: boolean;
    requiredApproveVotes: number;
    hasSupermajority: boolean;
    totalActiveMembers: number;
  };
  primaryReview: {
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
  userVote: boolean | null;
  comments: CommentItem[];
};

function isNewAmendment(amendment: AmendmentPayload) {
  return (
    amendment.status === "PRIMARY_REVIEW" &&
    amendment.primaryReviewClosedAt === null &&
    amendment.votingOpenedAt === null
  );
}

export default function AmendmentDetailClient({
  amendment: initialAmendment,
}: {
  amendment: AmendmentPayload;
}) {
  const router = useRouter();
  const [amendment, setAmendment] =
    useState<AmendmentPayload>(initialAmendment);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSeAdmin, setIsSeAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/authLevel");
        if (!response.ok) {
          setAuthLoaded(true);
          return;
        }
        const level = await response.json();
        setIsPrimary(level?.isPrimary ?? false);
        setIsSeAdmin(level?.isSeAdmin ?? false);
        setIsMember(level?.isMember ?? false);
        setIsUser(level?.isUser ?? false);
        setUserId(level?.userId ?? null);

        // Determine role name for admin bar — primary takes precedence since it has more powers
        if (level?.isPrimary) setRoleName("Primary Officer");
        else if (level?.isSeAdmin) setRoleName("SE Admin");
      } catch {
        // silently fail
      } finally {
        setAuthLoaded(true);
      }
    })();
  }, []);

  // Derive which primary positions the current user holds from the amendment data
  const userPrimaryPositionIds = (amendment.primaryReview?.positionSlots ?? [])
    .filter((slot) => slot.holder?.id === userId)
    .map((slot) => slot.positionId);

  async function changeStatus(
    nextStatus: AmendmentStatus,
    extraData?: Record<string, unknown>,
  ) {
    setActionMessage("");
    try {
      const response = await fetch(`/api/amendments/${amendment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, ...extraData }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update status");
      }
      const updated = await response.json();
      setAmendment((prev) => ({
        ...prev,
        status: updated.status as AmendmentStatus,
      }));

      // After setting updated status, re-fetch full data
      try {
        const detailResponse = await fetch(`/api/amendments/${amendment.id}`);
        if (detailResponse.ok) {
          const full = await detailResponse.json();
          setAmendment((prev) => ({ ...prev, ...full }));
        }
      } catch {
        /* ignore refresh failure */
      }
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Failed to update status",
      );
    }
  }

  async function merge() {
    setActionMessage("");
    try {
      const response = await fetch(`/api/amendments/${amendment.id}/merge`, {
        method: "POST",
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to merge");
      }
      const merged = await response.json();
      setAmendment((prev) => ({
        ...prev,
        status: merged.status as AmendmentStatus,
      }));
      router.refresh();
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Failed to merge amendment",
      );
    }
  }

  async function resubmitPr() {
    setActionMessage("");
    try {
      const response = await fetch(
        `/api/amendments/${amendment.id}/resubmit-pr`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to re-submit PR");
      }

      const refreshed = await fetch(`/api/amendments/${amendment.id}`);
      if (!refreshed.ok) {
        throw new Error(
          "PR was created, but the amendment could not be refreshed",
        );
      }

      const full = await refreshed.json();
      setAmendment((prev) => ({ ...prev, ...full }));
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Failed to re-submit PR",
      );
    }
  }

  if (!authLoaded) {
    return <AmendmentDetailSkeleton />;
  }

  const canResubmitPr =
    !amendment.githubPrNumber &&
    amendment.status !== "WITHDRAWN" &&
    amendment.status !== "MERGED" &&
    amendment.status !== "REJECTED" &&
    (amendment.author.id === userId || isPrimary || isSeAdmin);

  return (
    <section className="w-full max-w-6xl mx-auto px-2 md:px-4 space-y-5">
      {/* Breadcrumb */}
      <AmendmentBreadcrumb items={[{ label: amendment.title }]} />

      <NeoCard depth={1} className="p-5 md:p-7 space-y-5">
        {isNewAmendment(amendment) && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                New Amendment
              </span>
              <p className="text-sm text-amber-900/80 dark:text-amber-100/90">
                This proposal was just introduced and is currently in primary
                officer review before member voting opens.
              </p>
            </div>
          </div>
        )}

        {/* Header — no inner card, just content within the NeoCard */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5 min-w-0 flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                {amendment.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Proposed by{" "}
                <span className="font-medium text-foreground">
                  {amendment.author.name ?? "SSE Member"}
                </span>
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <AmendmentStatusBadge status={amendment.status} />
              {canResubmitPr && (
                <Button
                  size="xs"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={resubmitPr}
                >
                  Re-submit PR
                </Button>
              )}
              {(isPrimary || isSeAdmin) &&
                amendment.status !== "WITHDRAWN" &&
                amendment.status !== "MERGED" &&
                amendment.status !== "REJECTED" && (
                  <ConfirmationDialog
                    trigger={
                      <Button
                        size="xs"
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-destructive sm:w-auto"
                      >
                        Withdraw
                      </Button>
                    }
                    title="Withdraw Amendment"
                    description="This will withdraw the amendment from consideration."
                    confirmLabel="Withdraw"
                    variant="destructive"
                    onConfirm={() =>
                      changeStatus("WITHDRAWN" as AmendmentStatus)
                    }
                  />
                )}
              {amendment.githubPrNumber && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`https://github.com/rit-sse/governing-docs/pull/${amendment.githubPrNumber}`}
                        target="_blank"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-surface-3 px-2.5 py-1 text-xs font-mono font-medium text-foreground transition-colors hover:bg-surface-4 sm:w-auto"
                      >
                        <svg
                          className="h-3.5 w-3.5 opacity-60"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
                          />
                        </svg>
                        PR #{amendment.githubPrNumber}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View pull request on GitHub</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Description */}
          {amendment.description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
              {amendment.description}
            </p>
          )}

          {/* Timeline */}
          <AmendmentTimeline
            events={[
              { label: "Created", date: amendment.createdAt },
              { label: "Published", date: amendment.publishedAt },
              {
                label: "Primary review opened",
                date: amendment.primaryReviewOpenedAt,
              },
              {
                label: "Primary review closed",
                date: amendment.primaryReviewClosedAt,
              },
              { label: "Voting opened", date: amendment.votingOpenedAt },
              { label: "Voting closed", date: amendment.votingClosedAt },
            ]}
          />

          {/* Semantic change indicator */}
          {amendment.isSemanticChange && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-md px-2 py-0.5 w-fit cursor-help">
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Semantic change
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    This amendment changes the meaning of the constitution and
                    requires a 2/3 quorum + 2/3 supermajority to pass.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Diff viewer — takes majority of space */}
          <Card
            depth={2}
            className="lg:col-span-3 p-4 md:p-5 order-2 lg:order-1"
          >
            <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
              <CardTitle>Patch Review</CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                inline diff
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <DiffViewer
                originalContent={amendment.originalContent}
                proposedContent={amendment.proposedContent}
              />
            </CardContent>
          </Card>

          {/* Right sidebar — VotePanel appears first on mobile */}
          <div className="lg:col-span-2 space-y-5 order-1 lg:order-2">
            <VotePanel
              amendmentId={amendment.id}
              isSemanticChange={amendment.isSemanticChange}
              status={amendment.status}
              totalVotes={amendment.votes.totalVotes}
              approveVotes={amendment.votes.approveVotes}
              rejectVotes={amendment.votes.rejectVotes}
              requiredVotingParticipation={
                amendment.votes.requiredVotingParticipation
              }
              totalActiveMembers={amendment.votes.totalActiveMembers}
              userVote={amendment.userVote}
              isMember={isMember}
              isUser={isUser}
              isPrimary={isPrimary}
              isSeAdmin={isSeAdmin}
              primaryReview={amendment.primaryReview}
              votingEndsAt={amendment.votingEndsAt}
              userPrimaryPositionIds={userPrimaryPositionIds}
              onChangeStatus={changeStatus}
              onMerge={merge}
              actionMessage={actionMessage}
            />

            <CommentThread
              amendmentId={amendment.id}
              initialComments={amendment.comments}
              canComment={isMember}
              isUser={isUser}
            />
          </div>
        </div>
      </NeoCard>
    </section>
  );
}
