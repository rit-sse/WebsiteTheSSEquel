"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  NeoCard,
  NeoCardHeader,
  NeoCardTitle,
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
import { Tooltip } from "@/components/ui/tooltip";
import {
  ElectionStatusBadge,
  StatCard,
  ElectionEmptyState,
} from "@/components/elections";
import type {
  ElectionListItem,
  ElectionStatus,
} from "@/components/elections/types";
import { ELECTION_PHASE_LABELS } from "@/components/elections/types";
import {
  Plus,
  ChevronRight,
  Vote,
  Users,
  Award,
  TrendingUp,
  Loader2,
} from "lucide-react";

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

  const totalVoters = useMemo(
    () =>
      elections.reduce(
        (sum, e) => sum + (e.ballots?.length ?? 0),
        0
      ),
    [elections]
  );

  const pendingApprovals = useMemo(() => {
    if (!isSeAdmin) return 0;
    return elections.filter((e) => {
      if (!e.approvals) return false;
      if (e.status === "CERTIFIED" || e.status === "CANCELLED") return false;
      const requiredStage = getRequiredApprovalStage(e.status);
      if (!requiredStage) return false;
      const stageApprovals = e.approvals.filter((a) => a.stage === requiredStage);
      return stageApprovals.length < 2;
    }).length;
  }, [elections, isSeAdmin]);

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
    <div className="w-full space-y-6">
      {/* Header */}
      <NeoCard depth={1}>
        <NeoCardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <NeoCardTitle>Elections Management</NeoCardTitle>
            {isPresident && (
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Election
              </Button>
            )}
          </div>
          {isSeAdmin && !isPresident && (
            <p className="text-sm text-muted-foreground mt-1">
              Your role: review and approve election stages
            </p>
          )}
        </NeoCardHeader>
      </NeoCard>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active"
          value={activeCount}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals}
          icon={<Award className="h-5 w-5" />}
          iconBg={
            isSeAdmin && pendingApprovals > 0
              ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-primary/10 text-primary"
          }
        />
        <StatCard
          label="Total Voters"
          value={totalVoters}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Elections"
          value={elections.length}
          icon={<Vote className="h-5 w-5" />}
        />
      </div>

      {/* Elections list */}
      <NeoCard depth={1}>
        <NeoCardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <NeoCardTitle>All Elections</NeoCardTitle>
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
        </NeoCardHeader>
        <NeoCardContent>
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
            <div className="space-y-3">
              {filteredElections.map((election) => (
                <AdminElectionRow
                  key={election.id}
                  election={election}
                />
              ))}
            </div>
          )}
        </NeoCardContent>
      </NeoCard>

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
    </div>
  );
}

/* ─── Helper: determine the required approval stage for a given status ─── */

function getRequiredApprovalStage(
  status: string
): "CONFIG" | "BALLOT" | "CERTIFICATION" | null {
  switch (status) {
    case "DRAFT":
      return "CONFIG";
    case "NOMINATIONS_CLOSED":
      return "BALLOT";
    case "VOTING_CLOSED":
      return "CERTIFICATION";
    default:
      return null;
  }
}

/* ─── AdminElectionRow ─── */

function AdminElectionRow({ election }: { election: ElectionListItem }) {
  const totalNominations = election.offices.reduce(
    (sum, office) => sum + office.nominations.length,
    0
  );
  const ballotCount = election.ballots?.length ?? 0;

  // Approval indicators: check if both president and SE Admin have approved for the
  // required stage
  const requiredStage = getRequiredApprovalStage(election.status);
  const stageApprovals = election.approvals?.filter(
    (a) => a.stage === requiredStage
  );
  const presidentApproved = (stageApprovals?.length ?? 0) >= 1;
  const seAdminApproved = (stageApprovals?.length ?? 0) >= 2;

  return (
    <Link href={`/dashboard/elections/${election.id}`}>
      <Card
        depth={2}
        className="p-4 hover:bg-surface-3/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <ElectionStatusBadge status={election.status} />
              <h3 className="text-sm font-semibold truncate">
                {election.title}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Created{" "}
              {new Date(election.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Approval indicators */}
          {requiredStage && (
            <div className="hidden sm:flex items-center gap-1.5">
              <Tooltip
                content={
                  <p>
                    President: {presidentApproved ? "Approved" : "Pending"}
                  </p>
                }
                size="sm"
              >
                <div
                  className={`h-3 w-3 rounded-full ${
                    presidentApproved
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30"
                  }`}
                />
              </Tooltip>
              <Tooltip
                content={
                  <p>SE Admin: {seAdminApproved ? "Approved" : "Pending"}</p>
                }
                size="sm"
              >
                <div
                  className={`h-3 w-3 rounded-full ${
                    seAdminApproved
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30"
                  }`}
                />
              </Tooltip>
            </div>
          )}

          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
            <span>{totalNominations} candidates</span>
            <span>{ballotCount} ballots</span>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
