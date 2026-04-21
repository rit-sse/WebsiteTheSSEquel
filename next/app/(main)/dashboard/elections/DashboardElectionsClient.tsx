"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NeoCard, NeoCardContent } from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { ElectionStatusBadge } from "@/components/elections";
import type {
  ElectionListItem,
  ElectionStatus,
} from "@/components/elections/types";
import { Plus, ChevronRight, Loader2, Vote } from "lucide-react";

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
  "DRAFT",
  "NOMINATIONS_OPEN",
  "NOMINATIONS_CLOSED",
  "VOTING_OPEN",
  "VOTING_CLOSED",
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

  // Split elections into current (active) and past
  const currentElection = useMemo(
    () =>
      elections.find((e) =>
        ACTIVE_STATUSES.includes(e.status as ElectionStatus)
      ) ?? null,
    [elections]
  );

  const pastElections = useMemo(
    () =>
      elections.filter(
        (e) =>
          !ACTIVE_STATUSES.includes(e.status as ElectionStatus)
      ),
    [elections]
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
      <NeoCardContent className="space-y-8 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Elections</h1>
          {isPresident && !currentElection && (
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Election
            </Button>
          )}
        </div>

        {/* Current election */}
        {currentElection ? (
          <Link href={`/dashboard/elections/${currentElection.id}`}>
            <Card
              depth={2}
              className="p-6 hover:scale-[1.005] transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-display font-bold">
                      {currentElection.title}
                    </h2>
                    <ElectionStatusBadge status={currentElection.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {currentElection.offices.reduce(
                        (sum, o) => sum + o.nominations.length,
                        0
                      )}{" "}
                      nominations
                    </span>
                    <span>
                      {currentElection.ballots?.length ?? 0} ballots
                    </span>
                    <span>
                      {currentElection.offices.length} positions
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        ) : (
          <div className="text-center py-12 space-y-4">
            <Vote className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <div>
              <p className="text-lg font-display font-bold">
                No active election
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isPresident
                  ? "Create a new election to get started."
                  : "There is no election in progress right now."}
              </p>
            </div>
            {isPresident && (
              <Button
                onClick={() => setModalOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Election
              </Button>
            )}
          </div>
        )}

        {/* Past elections */}
        {pastElections.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Past elections
            </h2>
            <div className="divide-y divide-border/10">
              {pastElections.map((election) => (
                <Link
                  key={election.id}
                  href={`/dashboard/elections/${election.id}`}
                  className="group flex items-center gap-4 py-3 px-2 -mx-2 rounded-md hover:bg-surface-2/50 transition-colors"
                >
                  <ElectionStatusBadge status={election.status} />
                  <span className="text-sm font-medium truncate flex-1">
                    {election.title}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {new Date(election.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

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
          >
            <div className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="election-title">Title</Label>
                  <Input
                    id="election-title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Spring 2026 Primary Election"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="election-slug">Slug</Label>
                  <Input
                    id="election-slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="spring-2026-primary-election"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="election-description">Description</Label>
                <Textarea
                  id="election-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about this election..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Positions</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {primaryPositions.map((position) => (
                    <label
                      key={position.id}
                      className="flex items-center gap-2.5 rounded-lg p-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Checkbox
                        checked={positionIds.includes(position.id)}
                        onCheckedChange={(checked) =>
                          setPositionIds((current) =>
                            checked
                              ? [...current, position.id]
                              : current.filter((id) => id !== position.id)
                          )
                        }
                      />
                      <span className="text-sm">{position.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom-open">Nominations Open</Label>
                  <Input
                    id="nom-open"
                    type="datetime-local"
                    value={nominationsOpenAt}
                    onChange={(e) => setNominationsOpenAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom-close">Nominations Close</Label>
                  <Input
                    id="nom-close"
                    type="datetime-local"
                    value={nominationsCloseAt}
                    onChange={(e) => setNominationsCloseAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vote-open">Voting Opens</Label>
                  <Input
                    id="vote-open"
                    type="datetime-local"
                    value={votingOpenAt}
                    onChange={(e) => setVotingOpenAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vote-close">Voting Closes</Label>
                  <Input
                    id="vote-close"
                    type="datetime-local"
                    value={votingCloseAt}
                    onChange={(e) => setVotingCloseAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createElection}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create Election
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </NeoCardContent>
    </NeoCard>
  );
}
