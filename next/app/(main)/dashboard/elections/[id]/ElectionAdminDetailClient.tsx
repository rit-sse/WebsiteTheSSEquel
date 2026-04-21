"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  NeoCard,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
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
  NominationStatusBadge,
  EligibilityBadge,
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
  Loader2,
  Check,
  X,
  Settings,
} from "lucide-react";

interface Props {
  initialElection: SerializedElection;
  currentUserId: number | null;
  isPresident: boolean;
  isSeAdmin: boolean;
  approvalRole: "PRESIDENT" | "SE_ADMIN" | null;
}

function getNextPhase(
  status: ElectionStatus
): {
  nextStatus: ElectionStatus;
  label: string;
} | null {
  switch (status) {
    case "DRAFT":
      return { nextStatus: "NOMINATIONS_OPEN", label: "Nominations Open" };
    case "NOMINATIONS_OPEN":
      return { nextStatus: "NOMINATIONS_CLOSED", label: "Nominations Closed" };
    case "NOMINATIONS_CLOSED":
      return { nextStatus: "VOTING_OPEN", label: "Voting Open" };
    case "VOTING_OPEN":
      return { nextStatus: "VOTING_CLOSED", label: "Voting Closed" };
    case "VOTING_CLOSED":
      return { nextStatus: "CERTIFIED", label: "Certified" };
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
  const [election, setElection] = useState(initialElection);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailKind, setEmailKind] = useState("BALLOT_ANNOUNCEMENT");
  const [expandedNominations, setExpandedNominations] = useState<Set<number>>(
    new Set()
  );

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const [newSemesterLoading, setNewSemesterLoading] = useState(false);
  const [newSemesterConfirmed, setNewSemesterConfirmed] = useState(false);
  const startNewSemester = async () => {
    if (!newSemesterConfirmed) {
      setNewSemesterConfirmed(true);
      return;
    }
    setNewSemesterLoading(true);
    try {
      const response = await fetch(
        `/api/elections/${election.id}/start-new-semester`,
        { method: "POST" }
      );
      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to start new semester"
        );
      }
      const data = await response.json();
      toast.success(
        `New semester started — notified ${data.seAdminsNotified} SE admin${
          data.seAdminsNotified === 1 ? "" : "s"
        }.`
      );
      if (data.inviteDispatchUrl) {
        // Navigate the current user (if an SE admin) straight to the
        // dispatch page. Non-admins will be redirected back by its gate.
        window.location.href = data.inviteDispatchUrl;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start new semester"
      );
    } finally {
      setNewSemesterLoading(false);
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

  /* ─── Approvals (only used for certification) ─── */

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

  const eligibleCount = useMemo(() => {
    // Unique voters who have cast ballots, or a reasonable estimate
    // In a real system this would come from server; use ballots as proxy
    return Math.max(election.ballots.length, 1);
  }, [election.ballots]);

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
    <NeoCard depth={1} className="w-full">
      <NeoCardContent className="space-y-8 p-6 md:p-8">
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

      {/* Header section */}
      <Card depth={2} className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <h1 className="text-3xl font-display font-bold">
                {election.title}
              </h1>
              <ElectionStatusBadge status={election.status} />
            </div>
            <div className="flex items-center gap-1">
            {isPresident && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/elections/${election.slug}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Public Page
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/elections/${election.slug}/vote`}>
                    <Vote className="h-4 w-4 mr-2" />
                    View Ballot
                  </Link>
                </DropdownMenuItem>
                {isPresident && (
                  <>
                    <DropdownMenuSeparator />
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>

          <ElectionPhaseTimeline
            status={election.status}
            nominationsOpenAt={election.nominationsOpenAt}
            nominationsCloseAt={election.nominationsCloseAt}
            votingOpenAt={election.votingOpenAt}
            votingCloseAt={election.votingCloseAt}
            certifiedAt={election.certifiedAt}
          />

          {/* Inline advance button for President (not certification - that has its own section) */}
          {isPresident && nextPhase && nextPhase.nextStatus !== "CERTIFIED" && (
            <div className="flex items-center justify-between pt-4 border-t border-border/10 mt-4">
              <p className="text-sm text-muted-foreground">
                Next: {nextPhase.label}
              </p>
              <Button
                size="sm"
                onClick={() => updateStatus(nextPhase.nextStatus)}
                disabled={advanceLoading}
              >
                {advanceLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Advance
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ─── OFFICES & NOMINATIONS ─── */}
      <div className="space-y-4">
        {election.offices.map((office) => (
          <Card key={office.id} depth={2} className="p-5">
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="text-base font-display font-bold">
                {office.officerPosition.title}
              </h2>
              <span className="text-sm text-muted-foreground">
                {office.nominations.length} nomination{office.nominations.length !== 1 ? "s" : ""}
              </span>
            </div>
            {office.nominations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No nominations yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {office.nominations.map((nom) => (
                  <NominationRow
                    key={nom.id}
                    nomination={nom}
                    isPresident={isPresident}
                    expanded={expandedNominations.has(nom.id)}
                    onToggleExpand={() => toggleNominationExpanded(nom.id)}
                    onApprove={() => reviewNomination(nom.id, "APPROVED")}
                    onReject={() => reviewNomination(nom.id, "REJECTED")}
                  />
                ))}
              </div>
            )}
          </Card>
        ))}

        {election.offices.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No offices configured for this election.
          </p>
        )}
      </div>

      {/* ─── PARTICIPATION (visible once voting has started or finished) ─── */}
      {(election.status === "VOTING_OPEN" ||
        election.status === "VOTING_CLOSED" ||
        election.status === "CERTIFIED") &&
        election.ballots.length > 0 && (
          <Card depth={2} className="p-5 space-y-2">
            <h2 className="text-base font-display font-bold">Participation</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold">
                {election.ballots.length}
              </span>
              <span className="text-sm text-muted-foreground">
                ballot{election.ballots.length !== 1 ? "s" : ""} cast
              </span>
            </div>
            <Progress
              value={100}
              className="h-1.5"
            />
          </Card>
        )}

      {/* ─── NEW SEMESTER (CERTIFIED only, President/SE-Admin) ─── */}
      {election.status === "CERTIFIED" && (isPresident || isSeAdmin) && (
        <Card depth={2} className="p-5 space-y-3">
          <h2 className="text-base font-display font-bold">
            Start a new semester
          </h2>
          <p className="text-sm text-muted-foreground max-w-prose">
            Kicks off the new term — wipes every membership, deactivates all
            mentors and non–SE-Admin officers, then emails the SE Office a
            link to dispatch fresh officer invitations to the newly-elected
            primaries.
          </p>
          {newSemesterConfirmed ? (
            <div className="flex items-center gap-3 rounded-lg border-l-4 border-l-amber-500 bg-amber-50/40 p-4 dark:bg-amber-900/20">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This removes every current membership + officer except SE
                Admin. Are you sure?
              </p>
              <Button
                variant="destructive"
                onClick={startNewSemester}
                disabled={newSemesterLoading}
              >
                {newSemesterLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Yes, wipe and start fresh
              </Button>
              <Button
                variant="outline"
                onClick={() => setNewSemesterConfirmed(false)}
                disabled={newSemesterLoading}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={startNewSemester}>Start new semester</Button>
          )}
        </Card>
      )}

      {/* ─── CERTIFICATION (VOTING_CLOSED only) ─── */}
      {election.status === "VOTING_CLOSED" && (
        <Card depth={2} className="p-5 space-y-3">
          <h2 className="text-base font-display font-bold">Certification</h2>
          {isSeAdmin ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Review results and certify this election
              </p>
              <Button onClick={certify} disabled={advanceLoading}>
                {advanceLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Certify Results
              </Button>
            </div>
          ) : isPresident ? (
            <p className="text-sm text-muted-foreground">
              Results are ready. SE Admin must certify before finalizing.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Awaiting SE Admin certification.
            </p>
          )}
          <Link
            href={`/elections/${election.slug}/results`}
            className="text-sm text-primary hover:underline inline-block"
          >
            View full results
          </Link>
        </Card>
      )}

      {/* ─── SETTINGS MODAL (President only) ─── */}
      {isPresident && (
        <Modal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          title="Election Settings"
          description={`Edit settings for ${election.title}`}
        >
          <div className="space-y-6 mt-4">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-nom-open">Nominations Open</Label>
                  <Input
                    id="edit-nom-open"
                    type="datetime-local"
                    value={editNominationsOpenAt}
                    onChange={(e) => setEditNominationsOpenAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nom-close">Nominations Close</Label>
                  <Input
                    id="edit-nom-close"
                    type="datetime-local"
                    value={editNominationsCloseAt}
                    onChange={(e) => setEditNominationsCloseAt(e.target.value)}
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
                <Button onClick={saveSettings} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-border/10">
              <p className="text-sm text-muted-foreground mb-3">
                Cancelling an election is permanent.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={cancelElection}
                disabled={
                  cancelling ||
                  election.status === "CANCELLED" ||
                  election.status === "CERTIFIED"
                }
              >
                {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Cancel Election
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── EMAIL LOG (collapsible) ─── */}
      {election.emailLogs.length > 0 && (
        <Card depth={2} className="p-5">
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group w-full">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              Sent Emails ({election.emailLogs.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-2">
                {election.emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-2 text-sm"
                  >
                    <p className="font-medium">{log.subject}</p>
                    <p className="text-muted-foreground text-xs">
                      {log.kind.replace(/_/g, " ").toLowerCase()} &middot;{" "}
                      {log.sentBy.name} &middot; {log.recipientCount} recipients
                      &middot; {new Date(log.sentAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Email modal */}
      <EmailComposerModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        title="Email Eligible Voters"
        defaultSubject={`[SSE Election] ${election.title}`}
        onSend={sendEmail}
      />
      </NeoCardContent>
    </NeoCard>
  );
}

/* ─── NominationCard sub-component ─── */

function NominationRow({
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
    <Card depth={3} className="w-80 shrink-0 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          {nomination.nominee.image && (
            <AvatarImage src={nomination.nominee.image} alt={nomination.nominee.name} />
          )}
          <AvatarFallback className="text-xs">
            {getInitials(nomination.nominee.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium truncate">
              {nomination.nominee.name}
            </span>
            <NominationStatusBadge status={nomination.status} />
            <EligibilityBadge status={nomination.eligibilityStatus} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {nomination.nominee.email}
          </p>
        </div>
      </div>

      {nomination.statement && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {nomination.statement}
        </p>
      )}

      {isPresident && nomination.eligibilityStatus === "PENDING" && (
        <div className="flex gap-2 pt-1">
          <Button size="xs" variant="outline" className="flex-1 gap-1" onClick={onApprove}>
            <Check className="h-3 w-3" /> Approve
          </Button>
          <Button size="xs" variant="ghost" className="flex-1 gap-1" onClick={onReject}>
            <X className="h-3 w-3" /> Reject
          </Button>
        </div>
      )}

      {/* Expandable details */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        {expanded ? "Hide" : "Show"} details
      </button>

      {expanded && (
        <div className="grid gap-1 text-xs text-muted-foreground mt-1">
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
