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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
}

/* ---------- Helpers ---------- */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "";
  return (first + last).toUpperCase();
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
    <NeoCard depth={1} className="w-full">
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
                      {election.offices.map(
                        (office: SerializedElectionOffice) => (
                          <SelectItem
                            key={office.id}
                            value={office.id.toString()}
                          >
                            {office.officerPosition.title}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
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
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
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

      {/* ---- Your Nominations (pending response) ---- */}
      {myNominations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold">Your Nominations</h2>
          {myNominations.map((nomination) => {
            const state = getResponseForNomination(
              nomination.id,
              nomination
            );
            const isLoading = respondingId === nomination.id;

            return (
              <Card key={nomination.id} depth={2} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{nomination.officeTitle}</CardTitle>
                    <NominationStatusBadge status={nomination.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`statement-${nomination.id}`}>
                      Candidate Statement
                    </Label>
                    <Textarea
                      id={`statement-${nomination.id}`}
                      placeholder="Write your candidate statement..."
                      value={state.statement}
                      onChange={(e) =>
                        updateResponse(nomination.id, {
                          statement: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`year-${nomination.id}`}>
                        Year Level
                      </Label>
                      <Input
                        id={`year-${nomination.id}`}
                        type="number"
                        placeholder="e.g. 3"
                        value={state.yearLevel}
                        onChange={(e) =>
                          updateResponse(nomination.id, {
                            yearLevel: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`program-${nomination.id}`}>
                        Program
                      </Label>
                      <Input
                        id={`program-${nomination.id}`}
                        placeholder="e.g. Software Engineering"
                        value={state.program}
                        onChange={(e) =>
                          updateResponse(nomination.id, {
                            program: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        [
                          "canRemainEnrolledFullYear",
                          "Can remain enrolled full academic year",
                        ],
                        [
                          "canRemainEnrolledNextTerm",
                          "Can remain enrolled next term",
                        ],
                        ["isOnCampus", "On campus at RIT Henrietta"],
                        ["isOnCoop", "On co-op during the term"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Checkbox
                          id={`${key}-${nomination.id}`}
                          checked={state[key]}
                          onCheckedChange={(checked) =>
                            updateResponse(nomination.id, {
                              [key]: Boolean(checked),
                            })
                          }
                        />
                        <Label
                          htmlFor={`${key}-${nomination.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={() =>
                        respondToNomination(nomination, "ACCEPTED")
                      }
                      disabled={isLoading}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        respondToNomination(nomination, "DECLINED")
                      }
                      disabled={isLoading}
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
        {isCertified && (
          <Link
            href={`/elections/${election.slug}/results`}
            className="inline-flex items-center gap-1.5 text-primary hover:underline ml-auto"
          >
            <Trophy className="h-4 w-4" />
            View Results
          </Link>
        )}
        {(isPresident || isSeAdmin) && (
          <Link
            href={`/dashboard/elections/${election.id}`}
            className="text-primary hover:underline ml-auto"
          >
            {isPresident ? "Manage" : "Review"}
          </Link>
        )}
      </div>

      {/* ---- Positions & Candidates (full width) ---- */}
      <div className="grid gap-4 md:grid-cols-2">
          {election.offices.map((office: SerializedElectionOffice) => {
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
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm font-medium">
                            {getInitials(nomination.nominee.name)}
                          </AvatarFallback>
                        </Avatar>
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
    </NeoCard>
  );
}
