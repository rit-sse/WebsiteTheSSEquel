"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProposalStatusBadge } from "@/app/(main)/about/constitution/ProposalStatusBadge";

type QueueProposal = {
  id: number;
  title: string;
  summary: string;
  computedStatus: string;
  sectionHeadingPath: string;
  electionStartsAt: string | Date | null;
  electionEndsAt: string | Date | null;
  quorum: {
    approvedCount: number;
    required: number;
    approvalSlots: Array<{
      officerId: number;
      positionTitle: string;
      approved: boolean;
    }>;
  };
  permissions: {
    canApprove: boolean;
    canSchedule: boolean;
  };
};

const FILTERS = [
  { value: "needs-approval", label: "Needs approval" },
  { value: "scheduled", label: "Scheduled" },
  { value: "closed", label: "Closed not applied" },
  { value: "stale", label: "Stale" },
  { value: "all", label: "All" },
] as const;

function toDateTimeLocalValue(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ConstitutionGovernanceQueue({
  initialProposals,
}: {
  initialProposals: QueueProposal[];
}) {
  const [proposals, setProposals] = useState(initialProposals);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>(
    "needs-approval"
  );
  const [scheduleWindows, setScheduleWindows] = useState<
    Record<number, { start: string; end: string }>
  >(() =>
    Object.fromEntries(
      initialProposals.map((proposal) => [
        proposal.id,
        {
          start: toDateTimeLocalValue(proposal.electionStartsAt),
          end: toDateTimeLocalValue(proposal.electionEndsAt),
        },
      ])
    )
  );
  const [busyId, setBusyId] = useState<number | null>(null);

  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      switch (filter) {
        case "needs-approval":
          return proposal.computedStatus === "PRIMARY_REVIEW";
        case "scheduled":
          return proposal.computedStatus === "SCHEDULED";
        case "closed":
          return ["PASSED", "FAILED"].includes(proposal.computedStatus);
        case "stale":
          return proposal.computedStatus === "STALE";
        default:
          return true;
      }
    });
  }, [filter, proposals]);

  const syncProposal = (nextProposal: QueueProposal) => {
    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === nextProposal.id ? nextProposal : proposal
      )
    );
  };

  const toggleApproval = async (
    proposal: QueueProposal,
    officerId: number,
    approved: boolean
  ) => {
    setBusyId(proposal.id);
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
        throw new Error(data?.error || "Failed to update approval");
      }
      syncProposal(data);
      toast.success(
        approved ? "Approval withdrawn" : "Approval recorded"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setBusyId(null);
    }
  };

  const scheduleProposal = async (proposal: QueueProposal) => {
    const window = scheduleWindows[proposal.id];
    setBusyId(proposal.id);
    try {
      const response = await fetch(
        `/api/constitution/proposals/${proposal.id}/schedule`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            electionStartsAt: window?.start,
            electionEndsAt: window?.end,
          }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to schedule proposal");
      }
      syncProposal(data);
      toast.success("Election window scheduled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scheduling failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Constitution Queue</h1>
          <p className="text-muted-foreground">
            Primary officer review, quorum tracking, and election scheduling.
          </p>
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredProposals.map((proposal) => (
          <Card key={proposal.id} depth={2}>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">
                    Proposal #{proposal.id}
                  </div>
                  <CardTitle>{proposal.title}</CardTitle>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {proposal.summary}
                  </div>
                </div>
                <ProposalStatusBadge status={proposal.computedStatus} />
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                target_section: {proposal.sectionHeadingPath}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border p-3 text-sm">
                  quorum {proposal.quorum.approvedCount}/{proposal.quorum.required}
                </div>
                <div className="rounded-lg border border-border p-3 text-sm">
                  starts {proposal.electionStartsAt ? new Date(proposal.electionStartsAt).toLocaleString() : "unscheduled"}
                </div>
                <div className="rounded-lg border border-border p-3 text-sm">
                  ends {proposal.electionEndsAt ? new Date(proposal.electionEndsAt).toLocaleString() : "unscheduled"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/about/constitution/proposals/${proposal.id}`}>
                    Open public view
                  </Link>
                </Button>
              </div>

              {proposal.permissions.canApprove &&
                proposal.quorum.approvalSlots.length > 0 && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {proposal.quorum.approvalSlots.map((slot) => (
                      <div
                        key={slot.officerId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                      >
                        <div>
                          <div className="font-medium">{slot.positionTitle}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            slot {slot.officerId}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={slot.approved ? "outline" : "default"}
                          disabled={busyId === proposal.id}
                          onClick={() =>
                            toggleApproval(proposal, slot.officerId, slot.approved)
                          }
                        >
                          {slot.approved ? "Withdraw" : "Approve"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

              {proposal.permissions.canSchedule && (
                <div className="grid gap-3 rounded-lg border border-border bg-background/60 p-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor={`start-${proposal.id}`}>Election Start</Label>
                    <Input
                      id={`start-${proposal.id}`}
                      type="datetime-local"
                      value={scheduleWindows[proposal.id]?.start ?? ""}
                      onChange={(event) =>
                        setScheduleWindows((current) => ({
                          ...current,
                          [proposal.id]: {
                            ...current[proposal.id],
                            start: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`end-${proposal.id}`}>Election End</Label>
                    <Input
                      id={`end-${proposal.id}`}
                      type="datetime-local"
                      value={scheduleWindows[proposal.id]?.end ?? ""}
                      onChange={(event) =>
                        setScheduleWindows((current) => ({
                          ...current,
                          [proposal.id]: {
                            ...current[proposal.id],
                            end: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      disabled={busyId === proposal.id}
                      onClick={() => scheduleProposal(proposal)}
                    >
                      Set Election Window
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredProposals.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            No proposals match the current queue filter.
          </div>
        )}
      </div>
    </div>
  );
}
