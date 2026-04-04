"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  NeoCard,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ElectionStatusBadge,
  ElectionEmptyState,
} from "@/components/elections";
import type {
  ElectionListItem,
  ElectionStatus,
} from "@/components/elections/types";
import { ELECTION_PHASE_LABELS } from "@/components/elections/types";
import { Plus, ChevronRight, Loader2 } from "lucide-react";

interface Props {
  initialElections: ElectionListItem[];
  primaryPositions: { id: number; title: string; email: string }[];
  isPresident: boolean;
  isSeAdmin: boolean;
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const ACTIVE_STATUSES: ElectionStatus[] = [
  "NOMINATIONS_OPEN",
  "NOMINATIONS_CLOSED",
  "VOTING_OPEN",
  "VOTING_CLOSED",
];

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...Object.entries(ELECTION_PHASE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export default function DashboardElectionsClient({
  initialElections,
  primaryPositions,
  isPresident,
  isSeAdmin,
}: Props) {
  const router = useRouter();
  const now = new Date();

  const [elections, setElections] = useState(initialElections);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  // Create form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [positionIds, setPositionIds] = useState<number[]>(
    primaryPositions.map((p) => p.id)
  );
  const [nominationsOpenAt, setNominationsOpenAt] = useState(
    toDateTimeLocalValue(now)
  );
  const [nominationsCloseAt, setNominationsCloseAt] = useState(
    toDateTimeLocalValue(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000))
  );
  const [votingOpenAt, setVotingOpenAt] = useState(
    toDateTimeLocalValue(new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000))
  );
  const [votingCloseAt, setVotingCloseAt] = useState(
    toDateTimeLocalValue(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
  );
  const [submitting, setSubmitting] = useState(false);

  // Computed stats
  const activeCount = useMemo(
    () =>
      elections.filter((e) =>
        ACTIVE_STATUSES.includes(e.status as ElectionStatus)
      ).length,
    [elections]
  );

  const filteredElections = useMemo(
    () =>
      statusFilter === "all"
        ? elections
        : elections.filter((e) => e.status === statusFilter),
    [elections, statusFilter]
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(value);
  };

  const resetForm = () => {
    const resetNow = new Date();
    setTitle("");
    setSlug("");
    setSlugManuallyEdited(false);
    setDescription("");
    setPositionIds(primaryPositions.map((p) => p.id));
    setNominationsOpenAt(toDateTimeLocalValue(resetNow));
    setNominationsCloseAt(
      toDateTimeLocalValue(
        new Date(resetNow.getTime() + 2 * 24 * 60 * 60 * 1000)
      )
    );
    setVotingOpenAt(
      toDateTimeLocalValue(
        new Date(resetNow.getTime() + 4 * 24 * 60 * 60 * 1000)
      )
    );
    setVotingCloseAt(
      toDateTimeLocalValue(
        new Date(resetNow.getTime() + 7 * 24 * 60 * 60 * 1000)
      )
    );
  };

  const createElection = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (positionIds.length === 0) {
      toast.error("Select at least one position");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          positionIds,
          nominationsOpenAt,
          nominationsCloseAt,
          votingOpenAt,
          votingCloseAt,
        }),
      });

      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to create election"
        );
      }

      const created = await response.json();
      setElections((current) => [created, ...current]);
      setModalOpen(false);
      resetForm();
      toast.success("Election created");
      router.push(`/dashboard/elections/${created.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create election"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NeoCard depth={1} className="w-full">
      <NeoCardContent className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <Card depth={2} className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold">Elections</h1>
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground text-lg font-display">
                  {activeCount}
                </strong>{" "}
                active
              </span>
              <span>
                <strong className="text-foreground text-lg font-display">
                  {elections.length}
                </strong>{" "}
                total
              </span>
            </div>
          </div>
          {isPresident && (
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Election
            </Button>
          )}
        </div>
      </Card>

      {/* Elections list */}
      <div>
        <div className="flex items-center justify-end mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredElections.length === 0 ? (
          <ElectionEmptyState
            title={
              statusFilter === "all"
                ? "No elections yet"
                : "No elections match this filter"
            }
            description={
              statusFilter === "all"
                ? "Create your first election to get started."
                : "Try changing the status filter to see more elections."
            }
            action={
              isPresident && statusFilter === "all" ? (
                <Button onClick={() => setModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Election
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border/10">
            {filteredElections.map((election) => (
              <ElectionRow key={election.id} election={election} />
            ))}
          </div>
        )}
      </div>

      {/* Create Election Modal */}
      {isPresident && (
        <Modal
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setModalOpen(open);
          }}
          title="Create Election"
          description="Set up a new primary officer election."
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-title">Title</Label>
                <Input
                  id="create-title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Spring 2026 Primary Officer Election"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">Slug</Label>
                <Input
                  id="create-slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="spring-2026-primary-election"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share the scope and timeline for this election."
              />
            </div>

            <div className="space-y-2">
              <Label>Included Offices</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {primaryPositions.map((position) => {
                  const isChecked = positionIds.includes(position.id);
                  return (
                    <label
                      key={position.id}
                      className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm cursor-pointer hover:bg-surface-2 transition-colors"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          setPositionIds((current) =>
                            checked
                              ? [...current, position.id]
                              : current.filter((id) => id !== position.id)
                          )
                        }
                      />
                      <span>{position.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-nom-open">Nominations Open</Label>
                <Input
                  id="create-nom-open"
                  type="datetime-local"
                  value={nominationsOpenAt}
                  onChange={(e) => setNominationsOpenAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-nom-close">Nominations Close</Label>
                <Input
                  id="create-nom-close"
                  type="datetime-local"
                  value={nominationsCloseAt}
                  onChange={(e) => setNominationsCloseAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-vote-open">Voting Open</Label>
                <Input
                  id="create-vote-open"
                  type="datetime-local"
                  value={votingOpenAt}
                  onChange={(e) => setVotingOpenAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-vote-close">Voting Close</Label>
                <Input
                  id="create-vote-close"
                  type="datetime-local"
                  value={votingCloseAt}
                  onChange={(e) => setVotingCloseAt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={createElection}
                disabled={submitting}
                className="gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Creating..." : "Create Election"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </NeoCardContent>
    </NeoCard>
  );
}

/* ─── ElectionRow ─── */

function ElectionRow({ election }: { election: ElectionListItem }) {
  const totalNominations = election.offices.reduce(
    (sum, office) => sum + office.nominations.length,
    0
  );
  const ballotCount = election.ballots?.length ?? 0;

  return (
    <Link
      href={`/dashboard/elections/${election.id}`}
      className="group flex items-center gap-4 py-3 px-2 -mx-2 rounded-md hover:bg-surface-2/50 transition-colors"
    >
      <ElectionStatusBadge status={election.status} />

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate">{election.title}</h3>
      </div>

      <span className="hidden sm:inline text-xs text-muted-foreground">
        {new Date(election.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>

      <span className="hidden md:inline text-xs text-muted-foreground tabular-nums">
        {totalNominations} nominations &middot; {ballotCount} ballots
      </span>

      <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
    </Link>
  );
}
