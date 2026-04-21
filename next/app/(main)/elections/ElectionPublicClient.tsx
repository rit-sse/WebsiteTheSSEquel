"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  NeoCard,
  NeoCardHeader,
  NeoCardTitle,
  NeoCardDescription,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ElectionAvatar } from "@/components/elections/ElectionAvatar";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ElectionStatusBadge } from "@/components/elections/ElectionStatusBadge";
import { ElectionPhaseTimeline } from "@/components/elections/ElectionPhaseTimeline";
import { NominationStatusBadge } from "@/components/elections/NominationStatusBadge";
import RunningMateInviteCard, {
  type RunningMateInvitation,
} from "@/components/elections/RunningMateInviteCard";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import ElectionDevTweaks from "@/components/elections/ElectionDevTweaks";
import {
  ChevronRight,
  Vote,
  Users,
  BarChart3,
  Shield,
  Trophy,
  Info,
  CheckCircle,
  Send,
} from "lucide-react";
import type {
  SerializedElection,
  SerializedElectionOffice,
  SerializedNomination,
} from "@/components/elections/types";
import { compareByPrimaryOrder } from "@/lib/elections";

/* ---------- Props ---------- */

interface Props {
  election: SerializedElection;
  currentUserId: number | null;
  canNominate: boolean;
  isMember: boolean;
  isPrimary: boolean;
  isSeAdmin: boolean;
  isPresident: boolean;
}

/* ---------- Nomination response form state ---------- */

interface NominationResponseState {
  statement: string;
  yearLevel: string;
  program: string;
  canRemainEnrolledFullYear: boolean;
  canRemainEnrolledNextTerm: boolean;
  isOnCampus: boolean;
  isOnCoop: boolean;
}

function defaultResponseState(
  nomination: SerializedNomination
): NominationResponseState {
  return {
    statement: nomination.statement ?? "",
    yearLevel: nomination.yearLevel?.toString() ?? "",
    program: nomination.program ?? "",
    canRemainEnrolledFullYear: nomination.canRemainEnrolledFullYear ?? false,
    canRemainEnrolledNextTerm: nomination.canRemainEnrolledNextTerm ?? false,
    isOnCampus: nomination.isOnCampus ?? false,
    isOnCoop: nomination.isOnCoop ?? false,
  };
}

/* ---------- User search result ---------- */

interface UserSearchResult {
  id: number;
  name: string;
  email?: string;
  /** Resolved profile image URL (S3 or Google OAuth), or null when the
   * user has neither. Populated by `/api/user/search`. */
  image?: string | null;
}

/* ---------- My nomination with office info ---------- */

interface MyNomination extends SerializedNomination {
  officeTitle: string;
}

/* ========================================================================== */

export default function ElectionPublicClient({
  election,
  currentUserId,
  canNominate,
  isMember,
  isPrimary,
  isSeAdmin,
  isPresident,
}: Props) {
  /* ---- Nomination form state ---- */
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [submittingNomination, setSubmittingNomination] = useState(false);

  /* ---- Nomination response state ---- */
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseState, setResponseState] = useState<
    Record<number, NominationResponseState>
  >({});
  const [dismissedNominations, setDismissedNominations] = useState<Set<number>>(
    () => new Set()
  );

  /* ---- Derived data ---- */
  const myNominations: MyNomination[] = election.offices.flatMap(
    (office: SerializedElectionOffice) =>
      office.nominations
        .filter(
          (n: SerializedNomination) =>
            n.nomineeUserId === currentUserId &&
            n.status === "PENDING_RESPONSE" &&
            !dismissedNominations.has(n.id)
        )
        .map((n: SerializedNomination) => ({
          ...n,
          officeTitle: office.officerPosition.title,
        }))
  );

  /* ---- Amendment 12: accepted presidential nominations owned by me — I get
       a running-mate invite panel for each ---- */
  const myAcceptedPresidentNominations: MyNomination[] = election.offices
    .filter(
      (office: SerializedElectionOffice) =>
        office.officerPosition.title === "President"
    )
    .flatMap((office: SerializedElectionOffice) =>
      office.nominations
        .filter(
          (n: SerializedNomination) =>
            n.nomineeUserId === currentUserId && n.status === "ACCEPTED"
        )
        .map((n: SerializedNomination) => ({
          ...n,
          officeTitle: office.officerPosition.title,
        }))
    );

  /* ---- Amendment 12: inbound running-mate invitations addressed to me ---- */
  interface InboundRunningMateInvite {
    nominationId: number;
    status: string;
    expiresAt: string;
    presidentNomineeName: string;
  }
  const inboundRunningMateInvites: InboundRunningMateInvite[] =
    election.offices
      .filter(
        (office: SerializedElectionOffice) =>
          office.officerPosition.title === "President"
      )
      .flatMap((office: SerializedElectionOffice) =>
        office.nominations
          .filter((n: SerializedNomination) => {
            const inv = n.runningMateInvitation;
            return (
              inv &&
              inv.inviteeUserId === currentUserId &&
              inv.status === "INVITED"
            );
          })
          .map((n: SerializedNomination) => ({
            nominationId: n.id,
            status: n.runningMateInvitation!.status,
            expiresAt: n.runningMateInvitation!.expiresAt,
            presidentNomineeName: n.nominee.name,
          }))
      );

  const respondToRunningMateInvite = useCallback(
    async (
      nominationId: number,
      action: "ACCEPT" | "DECLINE"
    ) => {
      try {
        const response = await fetch(
          `/api/elections/${election.id}/nominations/${nominationId}/running-mate/respond`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          }
        );
        if (!response.ok) {
          toast.error(
            (await response.text()) ||
              "Failed to respond to running-mate invite"
          );
          return;
        }
        toast.success(
          action === "ACCEPT"
            ? "You're now running as VP on this ticket"
            : "Invitation declined"
        );
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } catch {
        toast.error("Failed to respond to running-mate invite");
      }
    },
    [election.id]
  );

  const totalNominations = election.offices.reduce(
    (acc: number, o: SerializedElectionOffice) => acc + o.nominations.length,
    0
  );

  const hasVoted = election.ballots.some(
    (b) => b.voterId === currentUserId
  );

  /* ---- Handlers ---- */

  const searchUsers = useCallback(async () => {
    if (!userQuery.trim()) {
      setUserResults([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/user/search?q=${encodeURIComponent(userQuery.trim())}`
      );
      if (!response.ok) {
        toast.error((await response.text()) || "Failed to search users");
        return;
      }
      const data = await response.json();
      setUserResults(data.items ?? []);
    } catch {
      toast.error("Failed to search users");
    }
  }, [userQuery]);

  const submitNomination = useCallback(async () => {
    if (!selectedOfficeId || !selectedUserId) {
      toast.error("Choose an office and a nominee");
      return;
    }
    setSubmittingNomination(true);
    try {
      const response = await fetch(
        `/api/elections/${election.id}/nominations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            electionOfficeId: Number(selectedOfficeId),
            nomineeUserId: selectedUserId,
          }),
        }
      );
      if (!response.ok) {
        toast.error((await response.text()) || "Failed to submit nomination");
        return;
      }
      toast.success("Nomination submitted");
      setSelectedOfficeId("");
      setSelectedUserId(null);
      setUserQuery("");
      setUserResults([]);
    } catch {
      toast.error("Failed to submit nomination");
    } finally {
      setSubmittingNomination(false);
    }
  }, [election.id, selectedOfficeId, selectedUserId]);

  const getResponseForNomination = useCallback(
    (nominationId: number, nomination: SerializedNomination) => {
      if (responseState[nominationId]) return responseState[nominationId];
      return defaultResponseState(nomination);
    },
    [responseState]
  );

  const updateResponse = useCallback(
    (nominationId: number, patch: Partial<NominationResponseState>) => {
      setResponseState((prev) => ({
        ...prev,
        [nominationId]: {
          ...(prev[nominationId] ?? defaultResponseState({} as SerializedNomination)),
          ...patch,
        },
      }));
    },
    []
  );

  const respondToNomination = useCallback(
    async (
      nomination: MyNomination,
      status: "ACCEPTED" | "DECLINED"
    ) => {
      const nominationId = nomination.id;
      setRespondingId(nominationId);
      try {
        const state = getResponseForNomination(nominationId, nomination);
        const payload: Record<string, unknown> = { status };
        if (status === "ACCEPTED") {
          payload.statement = state.statement;
          payload.yearLevel = state.yearLevel
            ? Number(state.yearLevel)
            : null;
          payload.program = state.program || null;
          payload.canRemainEnrolledFullYear = state.canRemainEnrolledFullYear;
          payload.canRemainEnrolledNextTerm = state.canRemainEnrolledNextTerm;
          payload.isOnCampus = state.isOnCampus;
          payload.isOnCoop = state.isOnCoop;
        }
        const response = await fetch(
          `/api/elections/${election.id}/nominations/${nominationId}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) {
          throw new Error((await response.text()) || "Failed to respond");
        }
        toast.success(`Nomination ${status.toLowerCase()}`);
        setDismissedNominations((prev) => new Set(prev).add(nominationId));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to respond"
        );
      } finally {
        setRespondingId(null);
      }
    },
    [election.id, getResponseForNomination]
  );

  /* ---- Conditional flags ---- */
  const isNominationsOpen = election.status === "NOMINATIONS_OPEN";
  const isVotingOpen = election.status === "VOTING_OPEN";
  const isCertified = election.status === "CERTIFIED";
  const isUser = currentUserId !== null;
  const showNominationForm = isNominationsOpen && canNominate;

  /* ========================================================================= */

  return (
    <NeoCard depth={1} className="election-scope w-full">
      <NeoCardContent className="space-y-6 p-6 md:p-8">
      {/* ---- Breadcrumbs ---- */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/elections" className="hover:text-foreground transition-colors">
          Elections
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{election.title}</span>
      </nav>

      {/* ---- Header ---- */}
      <Card depth={2} className="p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-display font-bold">{election.title}</h1>
            <ElectionStatusBadge status={election.status} />
            {election.status === "VOTING_OPEN" && (
              <span
                className="live-badge"
                aria-label="Voting is live"
                title="Voting is live"
              >
                <span className="live-dot" />
                Live
              </span>
            )}
          </div>
          {election.description && (
            <p className="text-base text-muted-foreground">
              {election.description}
            </p>
          )}
          <ElectionPhaseTimeline
            status={election.status}
            nominationsOpenAt={election.nominationsOpenAt}
            nominationsCloseAt={election.nominationsCloseAt}
            votingOpenAt={election.votingOpenAt}
            votingCloseAt={election.votingCloseAt}
            certifiedAt={election.certifiedAt}
          />
        </div>
      </Card>

      {/* ---- NOMINATION FORM (full-width, prominent when nominations open) ---- */}
      {showNominationForm && (
        <Card depth={2} id="nomination-form" className="p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-display font-bold">Nominate a Candidate</h2>
                <p className="text-muted-foreground mt-1">
                  Search for any SSE member and nominate them for an open position.
                  You can also nominate yourself.
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Office</Label>
                  <Select
                    value={selectedOfficeId}
                    onValueChange={setSelectedOfficeId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an office" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...election.offices]
                        // VP is ticket-derived — chosen as a running mate by
                        // the presidential nominee, not nominated directly.
                        .filter(
                          (office: SerializedElectionOffice) =>
                            office.officerPosition.title !== "Vice President"
                        )
                        .sort((a, b) =>
                          compareByPrimaryOrder(
                            a.officerPosition.title,
                            b.officerPosition.title
                          )
                        )
                        .map((office: SerializedElectionOffice) => (
                          <SelectItem
                            key={office.id}
                            value={office.id.toString()}
                          >
                            {office.officerPosition.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {/* Amendment 12 banner on President selection */}
                  {selectedOfficeId &&
                    election.offices.find(
                      (o: SerializedElectionOffice) =>
                        o.id === Number(selectedOfficeId)
                    )?.officerPosition.title === "President" && (
                      <div className="flex gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                          Your nominee will pick their own VP running mate
                          after accepting &mdash; no need to nominate a VP
                          separately.
                        </p>
                      </div>
                    )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search for a user</Label>
                  <div className="flex gap-2">
                    <Input
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Name or email"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchUsers();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={searchUsers}
                      type="button"
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {userResults.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select a nominee</Label>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {userResults.map((user) => {
                      const isSelected = selectedUserId === user.id;
                      return (
                        <div
                          key={user.id}
                          className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-all ${
                            isSelected
                              ? "ring-2 ring-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <ElectionAvatar
                            user={user}
                            className="h-9 w-9 border-2 border-black"
                            fallbackClassName="text-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.name}
                            </p>
                            {user.email && (
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 rounded-lg bg-surface-3/30 text-sm text-muted-foreground">
                  Search for a user to see results here
                </div>
              )}
              <Button
                onClick={submitNomination}
                disabled={
                  !selectedOfficeId || !selectedUserId || submittingNomination
                }
                className="w-full"
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Nomination
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ---- VOTING CTA (full-width, prominent when voting open) ---- */}
      {isVotingOpen && isMember && (
        <Card depth={2} className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Vote className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-display font-bold">
                {hasVoted ? "You've voted!" : "Voting is open"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {hasVoted
                  ? "You can update your ballot until voting closes."
                  : "Cast your ranked-choice ballot for each position. Rank candidates in order of preference."}
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={`/elections/${election.slug}/vote`}>
                <Vote className="mr-2 h-4 w-4" />
                {hasVoted ? "Update Ballot" : "Vote Now"}
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Non-member notice */}
      {!isMember && isUser && (
        <div className="flex items-center gap-3 rounded-lg border-l-4 border-l-amber-500 bg-amber-50/50 p-4 dark:bg-amber-900/20">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            You must be an SSE member to nominate candidates and vote.
          </p>
        </div>
      )}

      {/* ---- Your Nominations (pending response) ----
           The full accept + materials + running-mate flow lives on
           /elections/[slug]/respond/[nominationId]. Here we just surface
           the pending-response banner with a button that jumps there. */}
      {myNominations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold">Your Nominations</h2>
          {myNominations.map((nomination) => (
            <Card key={nomination.id} depth={2} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="eyebrow">You&rsquo;ve been nominated</p>
                    <NominationStatusBadge status={nomination.status} />
                  </div>
                  <p className="mt-1 font-display text-lg font-bold">
                    {nomination.officeTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Accept or decline on the dedicated response page.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link
                    href={`/elections/${election.slug}/respond/${nomination.id}`}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Respond
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Amendment 12: inbound running-mate invites ---- */}
      {inboundRunningMateInvites.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold">
            Running-Mate Invitations
          </h2>
          {inboundRunningMateInvites.map((invite) => (
            <Card key={invite.nominationId} depth={2}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>
                    {invite.presidentNomineeName} invited you to run as VP
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Accept to appear on the presidential ticket. If the ticket
                  wins, you become Vice President.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4">
                <NeoBrutalistButton
                  text="Accept"
                  variant="green"
                  size="sm"
                  icon={<CheckCircle className="h-4 w-4" />}
                  onClick={() =>
                    respondToRunningMateInvite(invite.nominationId, "ACCEPT")
                  }
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    respondToRunningMateInvite(invite.nominationId, "DECLINE")
                  }
                >
                  Decline
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Amendment 12: my accepted presidential ticket(s) ---- */}
      {myAcceptedPresidentNominations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold">
            Your Presidential Ticket
          </h2>
          {myAcceptedPresidentNominations.map((nomination) => {
            const invitation =
              (nomination.runningMateInvitation as
                | RunningMateInvitation
                | null
                | undefined) ?? null;
            return (
              <RunningMateInviteCard
                key={nomination.id}
                electionId={election.id}
                nominationId={nomination.id}
                invitation={invitation}
                onChange={() => {
                  // Force a refetch of the election so the invitation state
                  // is always fresh. The simplest thing here is a full page
                  // refresh since the server components own the data.
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* ---- Inline stats ---- */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground font-display text-base">{totalNominations}</strong> nominations
        </span>
        <span>
          <strong className="text-foreground font-display text-base">{election.ballots.length}</strong> ballots cast
        </span>
        <span>
          <strong className="text-foreground font-display text-base">{election.offices.length}</strong> positions
        </span>
        <Tooltip
          content={
            <p>
              Instant Runoff Voting: Voters rank candidates in order of
              preference. The candidate with the fewest votes is eliminated
              each round until a winner emerges.
            </p>
          }
          size="lg"
        >
          <span className="underline decoration-dotted cursor-help">
            IRV voting system
          </span>
        </Tooltip>
        {(isPresident || isSeAdmin) && (
          <Link
            href={`/dashboard/elections/${election.id}`}
            className="text-primary hover:underline ml-auto"
          >
            {isPresident ? "Manage" : "Review"}
          </Link>
        )}
      </div>

      {/* ---- Prominent Results CTA ----
           Show to everyone once certified, and to admins/presidents as soon
           as voting is closed so they can review the tally before certifying. */}
      {(isCertified ||
        ((isSeAdmin || isPresident) &&
          election.status === "VOTING_CLOSED")) && (
        <Card
          depth={2}
          className="flex flex-col items-center gap-3 p-6 text-center"
        >
          <p className="eyebrow inline-flex items-center gap-2 justify-center">
            <Trophy className="h-3 w-3" />{" "}
            {isCertified
              ? "Final · Certified"
              : "Preliminary · Pending certification"}
          </p>
          <p className="font-display text-lg font-bold">
            {isCertified
              ? "Your new officers have been chosen."
              : "Round-by-round results are ready."}
          </p>
          <p className="max-w-prose text-sm text-muted-foreground">
            {isCertified
              ? "Take a moment to meet the winners, then dig into the round-by-round tally."
              : election.status === "VOTING_CLOSED" && isSeAdmin
                ? "Review every office before you certify — certification publishes the results."
                : "The SE Office will certify these results shortly."}
          </p>
          <NeoBrutalistButton
            text={isCertified ? "See who won" : "View results"}
            variant="orange"
            icon={<Trophy className="h-[18px] w-[18px]" />}
            href={
              isCertified
                ? `/elections/${election.slug}/reveal`
                : `/elections/${election.slug}/results`
            }
          />
        </Card>
      )}

      {/* ---- Positions & Candidates (full width) ---- */}
      <div className="grid gap-4 md:grid-cols-2">
          {[...election.offices]
            .sort((a: SerializedElectionOffice, b: SerializedElectionOffice) =>
              compareByPrimaryOrder(
                a.officerPosition.title,
                b.officerPosition.title
              )
            )
            .map((office: SerializedElectionOffice) => {
            const acceptedNominations = office.nominations.filter(
              (n: SerializedNomination) => n.status === "ACCEPTED"
            );
            const candidateCount = acceptedNominations.length;

            return (
              <Card key={office.id} depth={2}>
                <CardHeader>
                  <CardTitle>{office.officerPosition.title}</CardTitle>
                  <CardDescription>
                    {candidateCount === 0
                      ? "No candidates yet"
                      : candidateCount === 1
                        ? "1 candidate"
                        : `${candidateCount} candidates`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidateCount === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {isNominationsOpen
                        ? "Nominations are still open for this position."
                        : "No candidates have been nominated for this position."}
                    </p>
                  )}
                  {acceptedNominations.map(
                    (nomination: SerializedNomination) => (
                      <Link
                        key={nomination.id}
                        href={`/elections/${election.slug}/candidates`}
                        className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                      >
                        <ElectionAvatar
                          user={nomination.nominee}
                          className="h-10 w-10 border-2 border-black"
                          fallbackClassName="text-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {nomination.nominee.name}
                            </span>
                            <NominationStatusBadge
                              status={nomination.status}
                            />
                          </div>
                          {nomination.statement && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {nomination.statement}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </Link>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
      </NeoCardContent>
      <ElectionDevTweaks
        electionId={election.id}
        currentStatus={election.status}
        canAccess={isSeAdmin}
      />
    </NeoCard>
  );
}
