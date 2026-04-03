"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NeoCard,
  NeoCardContent,
  NeoCardHeader,
  NeoCardTitle,
} from "@/components/ui/neo-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalDiffView } from "@/app/(main)/about/constitution/ProposalDiffView";
import { ProposalStatusBadge } from "@/app/(main)/about/constitution/ProposalStatusBadge";

type ProposalDetail = {
  id: number;
  title: string;
  summary: string;
  rationale: string;
  computedStatus: string;
  baseDocumentSha: string;
  sectionHeadingPath: string;
  proposedSectionMarkdown: string;
  fullProposedMarkdown: string;
  unifiedDiff: string;
  submittedAt: string | Date | null;
  electionStartsAt: string | Date | null;
  electionEndsAt: string | Date | null;
  appliedAt: string | Date | null;
  appliedCommitSha: string | null;
  author: { id: number; name: string; email: string };
  quorum: {
    approvedCount: number;
    required: number;
    approvalSlots: Array<{
      officerId: number;
      positionTitle: string;
      approved: boolean;
      approvedAt: string | Date | null;
    }>;
    approvals: Array<{
      officerId: number;
      positionTitle: string;
      userId: number;
      approverName: string;
      createdAt: string | Date;
    }>;
  };
  vote: {
    canVote: boolean;
    viewerChoice: string | null;
    resultsPublic: boolean;
    totalCount: number | null;
    yesCount: number | null;
    noCount: number | null;
  };
  permissions: {
    canEdit: boolean;
    canApprove: boolean;
    canSchedule: boolean;
    canApply: boolean;
  };
};

function formatDateTime(dateString: string | Date | null) {
  if (!dateString) return "Not scheduled";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConstitutionProposalDetail({
  initialProposal,
}: {
  initialProposal: ProposalDetail;
}) {
  function toDateTimeLocalValue(value: string | Date | null) {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  const [proposal, setProposal] = useState(initialProposal);
  const [isMutating, setIsMutating] = useState(false);
  const [editDraft, setEditDraft] = useState(() => ({
    title: initialProposal.title,
    summary: initialProposal.summary,
    rationale: initialProposal.rationale,
    proposedSectionMarkdown: initialProposal.proposedSectionMarkdown,
  }));
  const [scheduleWindow, setScheduleWindow] = useState(() => ({
    start: toDateTimeLocalValue(initialProposal.electionStartsAt),
    end: toDateTimeLocalValue(initialProposal.electionEndsAt),
  }));
  const quorumReached = proposal.quorum.approvedCount >= proposal.quorum.required;

  useEffect(() => {
    setEditDraft({
      title: proposal.title,
      summary: proposal.summary,
      rationale: proposal.rationale,
      proposedSectionMarkdown: proposal.proposedSectionMarkdown,
    });
    setScheduleWindow({
      start: toDateTimeLocalValue(proposal.electionStartsAt),
      end: toDateTimeLocalValue(proposal.electionEndsAt),
    });
  }, [
    proposal.title,
    proposal.summary,
    proposal.rationale,
    proposal.proposedSectionMarkdown,
    proposal.electionStartsAt,
    proposal.electionEndsAt,
  ]);

  const handleApproval = async (
    officerId: number,
    approved: boolean
  ) => {
    setIsMutating(true);
    try {
      const response = await fetch(
        `/api/constitution/proposals/${proposal.id}/approval`,
        {
          method: approved ? "DELETE" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ officerId }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update quorum approval");
      }
      setProposal(data);
      toast.success(
        approved ? "Primary approval withdrawn" : "Primary approval recorded"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Approval update failed"
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleVote = async (choice: "YES" | "NO") => {
    setIsMutating(true);
    try {
      const response = await fetch(
        `/api/constitution/proposals/${proposal.id}/vote`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to record vote");
      }
      setProposal(data);
      toast.success(`Vote recorded: ${choice}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vote failed");
    } finally {
      setIsMutating(false);
    }
  };

  const handleSchedule = async () => {
    setIsMutating(true);
    try {
      const response = await fetch(
        `/api/constitution/proposals/${proposal.id}/schedule`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            electionStartsAt: scheduleWindow.start,
            electionEndsAt: scheduleWindow.end,
          }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to schedule election window");
      }
      setProposal(data);
      setScheduleWindow({
        start: toDateTimeLocalValue(data.electionStartsAt),
        end: toDateTimeLocalValue(data.electionEndsAt),
      });
      toast.success("Proposal pushed to member vote");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Scheduling failed"
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleSaveEdits = async () => {
    setIsMutating(true);
    try {
      const response = await fetch(`/api/constitution/proposals/${proposal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editDraft.title,
          summary: editDraft.summary,
          rationale: editDraft.rationale,
          sectionHeadingPath: proposal.sectionHeadingPath,
          proposedSectionMarkdown: editDraft.proposedSectionMarkdown,
          action: "save",
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save amendment edits");
      }
      setProposal(data);
      toast.success("Amendment wording updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Save amendment edits failed"
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleApply = async () => {
    setIsMutating(true);
    try {
      const response = await fetch(
        `/api/constitution/proposals/${proposal.id}/apply`,
        {
          method: "POST",
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to apply proposal");
      }
      setProposal(data);
      toast.success("Constitution patch pushed to governing-docs/main");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Apply failed");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <NeoCard depth={1}>
        <NeoCardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Amendment Proposal #{proposal.id}
              </div>
              <NeoCardTitle className="mt-2 text-3xl">{proposal.title}</NeoCardTitle>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                {proposal.summary}
              </p>
            </div>
            <ProposalStatusBadge status={proposal.computedStatus} />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card depth={2} className="p-3">
              <div className="font-mono text-xs text-muted-foreground">
                author
              </div>
              <div className="mt-1 font-medium">{proposal.author.name}</div>
            </Card>
            <Card depth={2} className="p-3">
              <div className="font-mono text-xs text-muted-foreground">
                quorum
              </div>
              <div className="mt-1 font-medium">
                {proposal.quorum.approvedCount}/{proposal.quorum.required}
              </div>
            </Card>
            <Card depth={2} className="p-3">
              <div className="font-mono text-xs text-muted-foreground">
                election_window
              </div>
              <div className="mt-1 text-sm">
                {formatDateTime(proposal.electionStartsAt)}
              </div>
              <div className="text-sm text-muted-foreground">
                to {formatDateTime(proposal.electionEndsAt)}
              </div>
            </Card>
            <Card depth={2} className="p-3">
              <div className="font-mono text-xs text-muted-foreground">
                target_section
              </div>
              <div className="mt-1 text-sm">{proposal.sectionHeadingPath}</div>
            </Card>
            <Card depth={2} className="p-3">
              <div className="font-mono text-xs text-muted-foreground">
                base_sha
              </div>
              <div className="mt-1 break-all font-mono text-xs">
                {proposal.baseDocumentSha}
              </div>
            </Card>
          </div>
        </NeoCardHeader>

        <NeoCardContent className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Tabs defaultValue="diff" className="min-w-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diff">Diff</TabsTrigger>
            <TabsTrigger value="rendered">Rendered Proposal</TabsTrigger>
          </TabsList>
          <TabsContent value="diff" className="pt-4">
            <Card depth={2} className="p-0">
              <ProposalDiffView diff={proposal.unifiedDiff} />
            </Card>
          </TabsContent>
          <TabsContent value="rendered" className="pt-4">
            <Card depth={2} className="p-0">
              <div className="prose max-w-none rounded-lg p-6 dark:prose-invert">
              <ReactMarkdown>{proposal.fullProposedMarkdown}</ReactMarkdown>
              </div>
            </Card>
          </TabsContent>
            </Tabs>

            <div className="space-y-4">
          {proposal.permissions.canEdit && (
            <Card depth={2}>
              <CardHeader>
                <CardTitle className="text-lg">Primary Review Edits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="proposal-edit-title">Proposal Title</Label>
                  <Input
                    id="proposal-edit-title"
                    value={editDraft.title}
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="proposal-edit-summary">Summary</Label>
                  <Input
                    id="proposal-edit-summary"
                    value={editDraft.summary}
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        summary: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="proposal-edit-rationale">Rationale</Label>
                  <Textarea
                    id="proposal-edit-rationale"
                    rows={4}
                    value={editDraft.rationale}
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        rationale: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="proposal-edit-markdown">
                    Amendment Wording
                  </Label>
                  <div className="font-mono text-xs text-muted-foreground">
                    section: {proposal.sectionHeadingPath}
                  </div>
                  <Textarea
                    id="proposal-edit-markdown"
                    rows={14}
                    className="font-mono text-xs"
                    value={editDraft.proposedSectionMarkdown}
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        proposedSectionMarkdown: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button disabled={isMutating} onClick={handleSaveEdits}>
                    Save Amendment Changes
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isMutating}
                    onClick={() =>
                      setEditDraft({
                        title: proposal.title,
                        summary: proposal.summary,
                        rationale: proposal.rationale,
                        proposedSectionMarkdown: proposal.proposedSectionMarkdown,
                      })
                    }
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card depth={2}>
            <CardHeader>
              <CardTitle className="text-lg">Rationale</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {proposal.rationale}
            </CardContent>
          </Card>

          {(proposal.permissions.canApprove ||
            proposal.quorum.approvals.length > 0 ||
            proposal.permissions.canSchedule) && (
            <Card depth={2}>
              <CardHeader>
                <CardTitle className="text-lg">Primary Quorum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Primary approvals count per active primary officer position.
                </div>
                {proposal.permissions.canApprove &&
                  proposal.quorum.approvalSlots.length > 0 && (
                    <div className="space-y-2">
                      {proposal.quorum.approvalSlots.map((slot) => (
                        <div
                          key={slot.officerId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 p-3"
                        >
                          <div>
                            <div className="font-medium">{slot.positionTitle}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              officer_slot_id: {slot.officerId}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={slot.approved ? "outline" : "default"}
                            disabled={isMutating}
                            onClick={() =>
                              handleApproval(slot.officerId, slot.approved)
                            }
                          >
                            {slot.approved ? "Withdraw Approval" : "Approve as Role"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                {proposal.quorum.approvals.length > 0 && (
                  <div className="space-y-2">
                    {proposal.quorum.approvals.map((approval) => (
                      <div
                        key={`${approval.officerId}-${approval.createdAt}`}
                        className="rounded-lg border border-border/70 p-3 text-sm"
                      >
                        <div className="font-medium">{approval.positionTitle}</div>
                        <div className="text-muted-foreground">
                          {approval.approverName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {proposal.permissions.canSchedule && (
                  <div className="space-y-3 rounded-lg border border-border/70 bg-background/60 p-3">
                    <div className="text-sm text-muted-foreground">
                      {quorumReached
                        ? "Quorum is met. Set the election window to push this amendment to the full membership vote."
                        : `Quorum is not met yet. ${proposal.quorum.required - proposal.quorum.approvedCount} more approval${proposal.quorum.required - proposal.quorum.approvedCount === 1 ? "" : "s"} required before scheduling.`}
                    </div>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="proposal-election-start">
                          Election Start
                        </Label>
                        <Input
                          id="proposal-election-start"
                          type="datetime-local"
                          value={scheduleWindow.start}
                          onChange={(event) =>
                            setScheduleWindow((current) => ({
                              ...current,
                              start: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="proposal-election-end">
                          Election End
                        </Label>
                        <Input
                          id="proposal-election-end"
                          type="datetime-local"
                          value={scheduleWindow.end}
                          onChange={(event) =>
                            setScheduleWindow((current) => ({
                              ...current,
                              end: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        disabled={isMutating || !quorumReached}
                        onClick={handleSchedule}
                      >
                        Push to Membership Vote
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card depth={2}>
            <CardHeader>
              <CardTitle className="text-lg">Member Vote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposal.vote.canVote ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Voting is open for members. Current tallies remain hidden until the election window closes.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={isMutating}
                      onClick={() => handleVote("YES")}
                    >
                      Vote Yes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={isMutating}
                      onClick={() => handleVote("NO")}
                    >
                      Vote No
                    </Button>
                  </div>
                  {proposal.vote.viewerChoice && (
                    <div className="font-mono text-xs text-muted-foreground">
                      current_vote: {proposal.vote.viewerChoice}
                    </div>
                  )}
                </>
              ) : proposal.vote.resultsPublic ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-border p-3">
                    <div className="font-mono text-xs text-muted-foreground">
                      results
                    </div>
                    <div className="mt-2 text-sm">
                      Yes: {proposal.vote.yesCount} | No: {proposal.vote.noCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Turnout: {proposal.vote.totalCount}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-sm">
                    {proposal.computedStatus === "PASSED" ||
                    proposal.computedStatus === "APPLIED"
                      ? "The amendment passed by member vote."
                      : "The amendment did not pass."}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Results are not public until the election window closes.
                </div>
              )}
            </CardContent>
          </Card>

          {proposal.permissions.canApply && (
            <Card depth={2}>
              <CardHeader>
                <CardTitle className="text-lg">Presidential Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  This proposal passed. Applying it will push the patch directly to `governing-docs/main`.
                </div>
                <Button onClick={handleApply} disabled={isMutating} className="w-full">
                  Apply to Constitution
                </Button>
              </CardContent>
            </Card>
          )}
            </div>
          </div>
        </NeoCardContent>
      </NeoCard>
    </div>
  );
}
