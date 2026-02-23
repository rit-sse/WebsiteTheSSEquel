"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DiffViewer from "@/components/amendments/DiffViewer";
import VotePanel from "@/components/amendments/VotePanel";
import CommentThread from "@/components/amendments/CommentThread";
import AmendmentStatusBadge from "@/components/amendments/AmendmentStatusBadge";
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
  userVote: boolean | null;
  comments: CommentItem[];
};

export default function AmendmentDetailClient({ amendment: initialAmendment }: { amendment: AmendmentPayload }) {
  const router = useRouter();
  const [amendment, setAmendment] = useState<AmendmentPayload>(initialAmendment);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/authLevel");
        if (!response.ok) return;
        const level = await response.json();
        setIsPrimary(level?.isPrimary ?? false);
        setIsMember(level?.isMember ?? false);
      } catch {
        return;
      }
    })();
  }, []);

  async function changeStatus(nextStatus: AmendmentStatus) {
    setActionMessage("");
    try {
      const response = await fetch(`/api/amendments/${amendment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update status");
      }
      const updated = await response.json();
      setAmendment((prev) => ({ ...prev, status: updated.status as AmendmentStatus }));
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to update status");
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
      setAmendment((prev) => ({ ...prev, status: merged.status as AmendmentStatus }));
      router.refresh();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to merge amendment");
    }
  }

  const prUrl = amendment.githubPrNumber
    ? `https://github.com/rit-sse/governing-docs/pull/${amendment.githubPrNumber}`
    : null;

  return (
    <section className="w-full max-w-6xl space-y-6">
      <Card depth={1} className="p-4 md:p-6">
        <CardHeader className="p-0 flex flex-wrap gap-3 justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{amendment.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              By {amendment.author.name ?? "SSE Member"} • Proposed{" "}
              {new Date(amendment.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{amendment.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <AmendmentStatusBadge status={amendment.status} />
            {prUrl ? (
              <Link href={prUrl} target="_blank" className="text-sm font-medium text-primary underline">
                View PR #{amendment.githubPrNumber}
              </Link>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4 space-y-4">
          {isPrimary ? (
            <div className="flex flex-wrap gap-2">
              {(amendment.status === "OPEN" || amendment.status === "DRAFT") && (
                <Button size="sm" onClick={() => changeStatus("VOTING")}>
                  Start Voting
                </Button>
              )}
              {amendment.status === "VOTING" && (
                <>
                  <Button size="sm" onClick={() => changeStatus("APPROVED")}>
                    Mark as Approved
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => changeStatus("REJECTED")}>
                    Mark as Rejected
                  </Button>
                </>
              )}
              {amendment.status === "APPROVED" && (
                <Button size="sm" onClick={merge} disabled={amendment.status !== "APPROVED"}>
                  Merge PR
                </Button>
              )}
              {amendment.status !== "WITHDRAWN" && amendment.status !== "MERGED" && (
                <Button size="sm" variant="neutral" onClick={() => changeStatus("WITHDRAWN")}>
                  Withdraw
                </Button>
              )}
            </div>
          ) : null}
          {actionMessage ? <p className="text-sm text-destructive">{actionMessage}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        <Card depth={2} className="md:col-span-3 p-4">
          <CardHeader className="p-0">
            <CardTitle>Patch Review</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <DiffViewer originalContent={amendment.originalContent} proposedContent={amendment.proposedContent} />
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <VotePanel
            amendmentId={amendment.id}
            isSemanticChange={amendment.isSemanticChange}
            status={amendment.status}
            totalVotes={amendment.votes.totalVotes}
            approveVotes={amendment.votes.approveVotes}
            rejectVotes={amendment.votes.rejectVotes}
            requiredVotingParticipation={amendment.votes.requiredVotingParticipation}
            totalActiveMembers={amendment.votes.totalActiveMembers}
            userVote={amendment.userVote}
          />

          <Card depth={2} className="p-4">
            <CardHeader className="p-0">
              <CardTitle>Voting Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3 space-y-2 text-sm">
              <p>Required participation: {amendment.votes.requiredVotingParticipation} votes</p>
              <p>
                Approve: {amendment.votes.approveVotes} • Reject: {amendment.votes.rejectVotes}
              </p>
              <p>
                {amendment.votes.quorumAchieved
                  ? "Quorum requirement met."
                  : "Quorum not yet met."}
              </p>
              <p>
                {amendment.votes.hasSupermajority
                  ? "Supermajority requirement met."
                  : "Supermajority not yet met."}
              </p>
              <p>Active member pool: {amendment.votes.totalActiveMembers}</p>
              <p>Required semantic approve votes (2/3 of cast): {amendment.votes.requiredApproveVotes}</p>
            </CardContent>
          </Card>

          <CommentThread
            amendmentId={amendment.id}
            initialComments={amendment.comments}
            canComment={isMember}
          />
        </div>
      </div>
    </section>
  );
}
