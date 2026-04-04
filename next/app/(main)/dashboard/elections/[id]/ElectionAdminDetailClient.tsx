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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ElectionStatusBadge,
  ElectionPhaseTimeline,
  DualApprovalBar,
  ApprovalStageRow,
  StatCard,
  NominationStatusBadge,
  EligibilityBadge,
  ElectionEmptyState,
} from "@/components/elections";
import { ELECTION_PHASE_LABELS } from "@/components/elections/types";
import type {
  SerializedElection,
  SerializedNomination,
  ElectionApprovalStage,
  ElectionStatus,
} from "@/components/elections/types";
import EmailComposerModal, {
  type EmailComposerSendPayload,
} from "@/app/(main)/components/EmailComposerModal";
import {
  Mail,
  Eye,
  MoreHorizontal,
  ChevronRight,
  Vote,
  Users,
  Award,
  TrendingUp,
  Loader2,
  Settings,
  AlertTriangle,
  Check,
  X,
  UserCheck,
} from "lucide-react";

interface Props {
  initialElection: SerializedElection;
  currentUserId: number | null;
  isPresident: boolean;
  isSeAdmin: boolean;
  approvalRole: "PRESIDENT" | "SE_ADMIN" | null;
}

const APPROVAL_STAGES: { stage: ElectionApprovalStage; label: string }[] = [
  { stage: "CONFIG", label: "Configuration" },
  { stage: "BALLOT", label: "Ballot" },
  { stage: "CERTIFICATION", label: "Certification" },
];

function getNextPhase(
  status: ElectionStatus
): { nextStatus: ElectionStatus; label: string; requiredStage: ElectionApprovalStage | null } | null {
  switch (status) {
    case "DRAFT":
      return {
        nextStatus: "NOMINATIONS_OPEN",
        label: "Nominations Open",
        requiredStage: "CONFIG",
      };
    case "NOMINATIONS_OPEN":
      return {
        nextStatus: "NOMINATIONS_CLOSED",
        label: "Nominations Closed",
        requiredStage: null,
      };
    case "NOMINATIONS_CLOSED":
      return {
        nextStatus: "VOTING_OPEN",
        label: "Voting Open",
        requiredStage: "BALLOT",
      };
    case "VOTING_OPEN":
      return {
        nextStatus: "VOTING_CLOSED",
        label: "Voting Closed",
        requiredStage: null,
      };
    case "VOTING_CLOSED":
      return {
        nextStatus: "CERTIFIED",
        label: "Certified",
        requiredStage: "CERTIFICATION",
      };
    default:
      return null;
  }
}

function getActiveApprovalStage(
  status: ElectionStatus
): ElectionApprovalStage | null {
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function toDateTimeLocalValue(dateStr: string) {
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default function ElectionAdminDetailClient({
  initialElection,
  currentUserId,
  isPresident,
  isSeAdmin,
  approvalRole,
}: Props) {
  const router = useRouter();
  const [election, setElection] = useState(initialElection);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailKind, setEmailKind] = useState("BALLOT_ANNOUNCEMENT");
  const [expandedNominations, setExpandedNominations] = useState<Set<number>>(
    new Set()
  );

  // Settings tab state
  const [editTitle, setEditTitle] = useState(election.title);
  const [editDescription, setEditDescription] = useState(election.description);
  const [editNominationsOpenAt, setEditNominationsOpenAt] = useState(
    toDateTimeLocalValue(election.nominationsOpenAt)
  );
  const [editNominationsCloseAt, setEditNominationsCloseAt] = useState(
    toDateTimeLocalValue(election.nominationsCloseAt)
  );
  const [editVotingOpenAt, setEditVotingOpenAt] = useState(
    toDateTimeLocalValue(election.votingOpenAt)
  );
  const [editVotingCloseAt, setEditVotingCloseAt] = useState(
    toDateTimeLocalValue(election.votingCloseAt)
  );
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  /* ─── Data refresh ─── */

  const refreshElection = async () => {
    const response = await fetch(`/api/elections/${election.id}`);
    if (!response.ok) {
      throw new Error((await response.text()) || "Failed to refresh election");
    }
    const data: SerializedElection = await response.json();
    setElection(data);
    return data;
  };

  /* ─── Status transitions ─── */

  const updateStatus = async (status: ElectionStatus) => {
    setAdvanceLoading(true);
    try {
      const response = await fetch(`/api/elections/${election.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to update status"
        );
      }
      await refreshElection();
      toast.success(
        `Election moved to ${ELECTION_PHASE_LABELS[status] ?? status}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setAdvanceLoading(false);
    }
  };

  const certify = async () => {
    setAdvanceLoading(true);
    try {
      const response = await fetch(`/api/elections/${election.id}/certify`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to certify election"
        );
      }
      await refreshElection();
      toast.success("Election certified");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to certify election"
      );
    } finally {
      setAdvanceLoading(false);
    }
  };

  const cancelElection = async () => {
    setCancelling(true);
    try {
      const response = await fetch(`/api/elections/${election.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to cancel election"
        );
      }
      await refreshElection();
      toast.success("Election cancelled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel election"
      );
    } finally {
      setCancelling(false);
    }
  };

  /* ─── Approvals ─── */

  const handleApprove = async (stage: ElectionApprovalStage) => {
    setApprovalLoading(true);
    try {
      const response = await fetch(
        `/api/elections/${election.id}/approvals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage }),
        }
      );
      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to add approval"
        );
      }
      await refreshElection();
      toast.success("Approval added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add approval"
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRemoveApproval = async (stage: ElectionApprovalStage) => {
    setApprovalLoading(true);
    try {
      const response = await fetch(
        `/api/elections/${election.id}/approvals`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage }),
        }
      );
      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to remove approval"
        );
      }
      await refreshElection();
      toast.success("Approval removed");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove approval"
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  /* ─── Nomination review ─── */

  const reviewNomination = async (
    nominationId: number,
    eligibilityStatus: "APPROVED" | "REJECTED",
    reviewNotes = ""
  ) => {
    try {
      const response = await fetch(
        `/api/elections/${election.id}/nominations/${nominationId}/review`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eligibilityStatus, reviewNotes }),
        }
      );
      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to review nomination"
        );
      }
      await refreshElection();
      toast.success(`Nomination ${eligibilityStatus.toLowerCase()}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to review nomination"
      );
    }
  };

  /* ─── Email ─── */

  const sendEmail = async (payload: EmailComposerSendPayload) => {
    const response = await fetch(
      `/api/elections/${election.id}/send-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: emailKind,
          subject: payload.subject,
          message: payload.message,
          attachments: payload.attachments,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(
        (await response.text()) || "Failed to send election email"
      );
    }
    const data = await response.json();
    await refreshElection();
    return data;
  };

  /* ─── Settings: save ─── */

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/elections/${election.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          nominationsOpenAt: editNominationsOpenAt,
          nominationsCloseAt: editNominationsCloseAt,
          votingOpenAt: editVotingOpenAt,
          votingCloseAt: editVotingCloseAt,
        }),
      });
      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to save settings"
        );
      }
      await refreshElection();
      toast.success("Settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ─── Computed values ─── */

  const nextPhase = getNextPhase(election.status);
  const activeApprovalStage = getActiveApprovalStage(election.status);

  const totalNominations = election.offices.reduce(
    (sum, office) => sum + office.nominations.length,
    0
  );

  const approvedNominations = election.offices.reduce(
    (sum, office) =>
      sum +
      office.nominations.filter(
        (n) => n.eligibilityStatus === "APPROVED" && n.status === "ACCEPTED"
      ).length,
    0
  );

  const hasRequiredApprovals = useMemo(() => {
    if (!nextPhase?.requiredStage) return true;
    const stageApprovals = election.approvals.filter(
      (a) => a.stage === nextPhase.requiredStage
    );
    return stageApprovals.length >= 2;
  }, [election.approvals, nextPhase]);

  const missingApprovalReason = useMemo(() => {
    if (!nextPhase?.requiredStage) return null;
    const stageApprovals = election.approvals.filter(
      (a) => a.stage === nextPhase.requiredStage
    );
    if (stageApprovals.length === 0) return "Both approvals required";
    if (stageApprovals.length === 1) return "One more approval needed";
    return null;
  }, [election.approvals, nextPhase]);

  // SE Admin pending approval detection
  const seAdminPendingStage = useMemo(() => {
    if (!isSeAdmin || !activeApprovalStage) return null;
    const myApproval = election.approvals.find(
      (a) => a.stage === activeApprovalStage && a.userId === currentUserId
    );
    return myApproval ? null : activeApprovalStage;
  }, [isSeAdmin, activeApprovalStage, election.approvals, currentUserId]);

  // Unique voters from ballots
  const voters = useMemo(
    () => election.ballots.map((b) => b.voter),
    [election.ballots]
  );

  const toggleNominationExpanded = (nominationId: number) => {
    setExpandedNominations((prev) => {
      const next = new Set(prev);
      if (next.has(nominationId)) {
        next.delete(nominationId);
      } else {
        next.add(nominationId);
      }
      return next;
    });
  };

  /* ─── Render ─── */

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/dashboard/elections"
          className="hover:text-foreground transition-colors"
        >
          Elections
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate">
          {election.title}
        </span>
      </nav>

      {/* Header card */}
      <NeoCard depth={1}>
        <NeoCardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-display font-bold">
                  {election.title}
                </h1>
                <ElectionStatusBadge status={election.status} />
              </div>
            </div>
            {isPresident && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEmailKind("BALLOT_ANNOUNCEMENT");
                      setEmailOpen(true);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Voters
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEmailKind("BALLOT_REMINDER");
                      setEmailOpen(true);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reminder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/elections/${election.slug}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Page
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          <ElectionPhaseTimeline
            status={election.status}
            nominationsOpenAt={election.nominationsOpenAt}
            nominationsCloseAt={election.nominationsCloseAt}
            votingOpenAt={election.votingOpenAt}
            votingCloseAt={election.votingCloseAt}
            certifiedAt={election.certifiedAt}
          />

          {activeApprovalStage && (
            <DualApprovalBar
              stage={activeApprovalStage}
              stageLabel={
                APPROVAL_STAGES.find((s) => s.stage === activeApprovalStage)
                  ?.label ?? activeApprovalStage
              }
              approvals={election.approvals}
              currentUserId={currentUserId}
              currentUserRole={approvalRole}
              onApprove={handleApprove}
              onRemoveApproval={handleRemoveApproval}
              loading={approvalLoading}
            />
          )}
        </NeoCardContent>
      </NeoCard>

      {/* Phase advance banner (President only) */}
      {isPresident && nextPhase && (
        <Card depth={2} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  Ready to advance to {nextPhase.label}?
                </p>
                {missingApprovalReason && (
                  <p className="text-xs text-muted-foreground">
                    {missingApprovalReason}
                  </p>
                )}
              </div>
            </div>
            {hasRequiredApprovals ? (
              <Button
                onClick={() =>
                  nextPhase.nextStatus === "CERTIFIED"
                    ? certify()
                    : updateStatus(nextPhase.nextStatus)
                }
                disabled={advanceLoading}
                className="gap-2"
              >
                {advanceLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Advance to {nextPhase.label}
              </Button>
            ) : (
              <Tooltip
                content={
                  <p>
                    Cannot advance: {missingApprovalReason ?? "approvals needed"}
                  </p>
                }
                size="sm"
              >
                <Button disabled className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Advance to {nextPhase.label}
                </Button>
              </Tooltip>
            )}
          </div>
        </Card>
      )}

      {/* SE Admin pending approval banner */}
      {isSeAdmin && seAdminPendingStage && (
        <Card
          depth={2}
          className="p-4 border-l-4 border-l-amber-500"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  Your approval is needed for the{" "}
                  {APPROVAL_STAGES.find(
                    (s) => s.stage === seAdminPendingStage
                  )?.label ?? seAdminPendingStage}{" "}
                  stage
                </p>
                <p className="text-xs text-muted-foreground">
                  Review the election details and approve when ready.
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleApprove(seAdminPendingStage)}
              disabled={approvalLoading}
              className="gap-2"
            >
              {approvalLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Check className="h-4 w-4" />
              Approve
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nominations">Nominations</TabsTrigger>
          <TabsTrigger value="ballot">Ballot</TabsTrigger>
          <TabsTrigger value="voters">Voters</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          {isPresident && (
            <TabsTrigger value="settings">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── OVERVIEW TAB ─── */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Nominations"
                  value={totalNominations}
                  icon={<Users className="h-5 w-5" />}
                  iconBg="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                />
                <StatCard
                  label="Approved Candidates"
                  value={approvedNominations}
                  icon={<UserCheck className="h-5 w-5" />}
                  iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <StatCard
                  label="Ballots Cast"
                  value={election.ballots.length}
                  icon={<Vote className="h-5 w-5" />}
                  iconBg="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                />
                <StatCard
                  label="Offices"
                  value={election.offices.length}
                  icon={<Award className="h-5 w-5" />}
                  iconBg="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
              </div>

              {/* Email log */}
              <Card depth={2} className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Log
                </h3>
                {election.emailLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No email activity yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {election.emailLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-md border border-border px-3 py-2 text-sm"
                      >
                        <p className="font-medium">{log.subject}</p>
                        <p className="text-muted-foreground text-xs">
                          {log.kind} by {log.sentBy.name} to{" "}
                          {log.recipientCount} recipients on{" "}
                          {new Date(log.sentAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Approval stages */}
              <Card depth={2} className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Approval Stages
                </h3>
                <div className="space-y-3">
                  {APPROVAL_STAGES.map(({ stage, label }) => (
                    <ApprovalStageRow
                      key={stage}
                      stage={stage}
                      label={label}
                      approvals={election.approvals}
                      isCurrentStage={activeApprovalStage === stage}
                    />
                  ))}
                </div>
              </Card>

              {/* Quick actions */}
              <Card depth={2} className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    asChild
                  >
                    <Link href={`/elections/${election.slug}`}>
                      <Eye className="h-4 w-4" />
                      View Public Page
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    asChild
                  >
                    <Link href={`/elections/${election.slug}/vote`}>
                      <Vote className="h-4 w-4" />
                      View Ballot
                    </Link>
                  </Button>
                  {isPresident && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2"
                      onClick={() => {
                        setEmailKind("BALLOT_ANNOUNCEMENT");
                        setEmailOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Email Voters
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── NOMINATIONS TAB ─── */}
        <TabsContent value="nominations">
          <div className="space-y-6">
            {election.offices.map((office) => (
              <Card key={office.id} depth={2} className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">
                  {office.officerPosition.title}
                </h3>
                {office.nominations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No nominations yet for this position.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {office.nominations.map((nomination) => (
                      <NominationCard
                        key={nomination.id}
                        nomination={nomination}
                        isPresident={isPresident}
                        expanded={expandedNominations.has(nomination.id)}
                        onToggleExpand={() =>
                          toggleNominationExpanded(nomination.id)
                        }
                        onApprove={() =>
                          reviewNomination(nomination.id, "APPROVED")
                        }
                        onReject={() =>
                          reviewNomination(nomination.id, "REJECTED")
                        }
                      />
                    ))}
                  </div>
                )}
              </Card>
            ))}

            {election.offices.length === 0 && (
              <ElectionEmptyState
                title="No offices configured"
                description="This election does not have any offices set up."
              />
            )}
          </div>
        </TabsContent>

        {/* ─── BALLOT TAB ─── */}
        <TabsContent value="ballot">
          <Card depth={2} className="p-6">
            {election.ballots.length === 0 ? (
              <ElectionEmptyState
                title="No ballots cast yet"
                description="Ballots will appear here once voting begins and voters submit their rankings."
                icon={<Vote className="h-16 w-16 text-muted-foreground/30" />}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {election.ballots.length} Ballot
                    {election.ballots.length !== 1 ? "s" : ""} Cast
                  </h3>
                </div>
                <div className="space-y-2">
                  {election.ballots.map((ballot) => (
                    <div
                      key={ballot.id}
                      className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(ballot.voter.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {ballot.voter.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted{" "}
                          {new Date(ballot.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {ballot.rankings.length} rankings
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ─── VOTERS TAB ─── */}
        <TabsContent value="voters">
          <Card depth={2} className="p-6">
            {voters.length === 0 ? (
              <ElectionEmptyState
                title="No voters yet"
                description="Voters who have cast ballots will appear here."
                icon={<Users className="h-16 w-16 text-muted-foreground/30" />}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Voters ({voters.length})
                  </h3>
                  {isPresident && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setEmailKind("BALLOT_REMINDER");
                        setEmailOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Email All
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {voters.map((voter) => (
                    <div
                      key={voter.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-surface-3/50 transition-colors"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(voter.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{voter.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {voter.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ─── RESULTS TAB ─── */}
        <TabsContent value="results">
          <Card depth={2} className="p-6">
            {election.status === "VOTING_CLOSED" ||
            election.status === "CERTIFIED" ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Election Results</h3>
                <p className="text-sm text-muted-foreground">
                  {election.status === "CERTIFIED"
                    ? "This election has been certified. Final results are shown below."
                    : "Voting has closed. Results are available for review."}
                </p>
                <div className="space-y-4">
                  {election.offices.map((office) => {
                    const accepted = office.nominations.filter(
                      (n) =>
                        n.status === "ACCEPTED" &&
                        n.eligibilityStatus === "APPROVED"
                    );
                    return (
                      <Card
                        key={office.id}
                        depth={3}
                        className="p-4 space-y-2"
                      >
                        <h4 className="font-semibold">
                          {office.officerPosition.title}
                        </h4>
                        {accepted.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No eligible candidates.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {accepted.map((nom) => (
                              <div
                                key={nom.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[9px]">
                                    {getInitials(nom.nominee.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{nom.nominee.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {election.ballots.length} ballot
                          {election.ballots.length !== 1 ? "s" : ""} cast
                        </p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <ElectionEmptyState
                title="Results not yet available"
                description="Results will be displayed here once voting closes."
                icon={
                  <Award className="h-16 w-16 text-muted-foreground/30" />
                }
              />
            )}
          </Card>
        </TabsContent>

        {/* ─── SETTINGS TAB (President only) ─── */}
        {isPresident && (
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Edit form */}
              <Card depth={2} className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Election Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-nom-open">Nominations Open</Label>
                      <Input
                        id="edit-nom-open"
                        type="datetime-local"
                        value={editNominationsOpenAt}
                        onChange={(e) =>
                          setEditNominationsOpenAt(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-nom-close">
                        Nominations Close
                      </Label>
                      <Input
                        id="edit-nom-close"
                        type="datetime-local"
                        value={editNominationsCloseAt}
                        onChange={(e) =>
                          setEditNominationsCloseAt(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-vote-open">Voting Open</Label>
                      <Input
                        id="edit-vote-open"
                        type="datetime-local"
                        value={editVotingOpenAt}
                        onChange={(e) => setEditVotingOpenAt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-vote-close">Voting Close</Label>
                      <Input
                        id="edit-vote-close"
                        type="datetime-local"
                        value={editVotingCloseAt}
                        onChange={(e) => setEditVotingCloseAt(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={saveSettings}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Danger zone */}
              <Card
                depth={2}
                className="p-6 space-y-4 border-l-4 border-l-destructive"
              >
                <h3 className="text-lg font-semibold text-destructive">
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cancelling an election is permanent and cannot be undone. All
                  progress, nominations, and ballots will be preserved but the
                  election will no longer be active.
                </p>
                <Button
                  variant="destructive"
                  onClick={cancelElection}
                  disabled={
                    cancelling ||
                    election.status === "CANCELLED" ||
                    election.status === "CERTIFIED"
                  }
                  className="gap-2"
                >
                  {cancelling && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <X className="h-4 w-4" />
                  Cancel Election
                </Button>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Email modal */}
      <EmailComposerModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        title="Email Eligible Voters"
        defaultSubject={`[SSE Election] ${election.title}`}
        onSend={sendEmail}
      />
    </div>
  );
}

/* ─── NominationCard sub-component ─── */

function NominationCard({
  nomination,
  isPresident,
  expanded,
  onToggleExpand,
  onApprove,
  onReject,
}: {
  nomination: SerializedNomination;
  isPresident: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card depth={3} className="p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">
              {getInitials(nomination.nominee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{nomination.nominee.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {nomination.nominee.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NominationStatusBadge status={nomination.status} />
          <EligibilityBadge status={nomination.eligibilityStatus} />
        </div>
      </div>

      {nomination.statement && (
        <div className="bg-surface-2 rounded-md p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Candidate Statement
          </p>
          <p className="whitespace-pre-wrap">{nomination.statement}</p>
        </div>
      )}

      {isPresident && nomination.eligibilityStatus === "PENDING" && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onApprove}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      )}

      {/* Expandable eligibility details */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        {expanded ? "Hide" : "Show"} eligibility details
      </button>

      {expanded && (
        <div className="grid gap-1 text-xs md:grid-cols-2 text-muted-foreground bg-surface-2 rounded-md p-3">
          <p>
            <span className="font-medium text-foreground">Nominated by:</span>{" "}
            {nomination.nominator.name}
          </p>
          <p>
            <span className="font-medium text-foreground">Year level:</span>{" "}
            {nomination.yearLevel ?? "Not provided"}
          </p>
          <p>
            <span className="font-medium text-foreground">Program:</span>{" "}
            {nomination.program ?? "Not provided"}
          </p>
          <p>
            <span className="font-medium text-foreground">On campus:</span>{" "}
            {nomination.isOnCampus === null
              ? "Not provided"
              : nomination.isOnCampus
                ? "Yes"
                : "No"}
          </p>
          <p>
            <span className="font-medium text-foreground">On co-op:</span>{" "}
            {nomination.isOnCoop === null
              ? "Not provided"
              : nomination.isOnCoop
                ? "Yes"
                : "No"}
          </p>
          <p>
            <span className="font-medium text-foreground">
              Can remain enrolled (full year):
            </span>{" "}
            {nomination.canRemainEnrolledFullYear === null
              ? "Not provided"
              : nomination.canRemainEnrolledFullYear
                ? "Yes"
                : "No"}
          </p>
          <p>
            <span className="font-medium text-foreground">
              Can remain enrolled (next term):
            </span>{" "}
            {nomination.canRemainEnrolledNextTerm === null
              ? "Not provided"
              : nomination.canRemainEnrolledNextTerm
                ? "Yes"
                : "No"}
          </p>
          {nomination.reviewNotes && (
            <p className="md:col-span-2">
              <span className="font-medium text-foreground">
                Review notes:
              </span>{" "}
              {nomination.reviewNotes}
            </p>
          )}
          {nomination.reviewedBy && (
            <p className="md:col-span-2">
              <span className="font-medium text-foreground">
                Reviewed by:
              </span>{" "}
              {nomination.reviewedBy.name}
              {nomination.reviewedAt &&
                ` on ${new Date(nomination.reviewedAt).toLocaleString()}`}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
