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
    <div className="w-full space-y-6">
      {/* ---- Breadcrumbs ---- */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/elections" className="hover:text-foreground transition-colors">
          Elections
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{election.title}</span>
      </nav>

      {/* ---- Header Card ---- */}
      <NeoCard depth={1}>
        <NeoCardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <NeoCardTitle className="text-3xl">{election.title}</NeoCardTitle>
            <ElectionStatusBadge status={election.status} />
          </div>
          {election.description && (
            <NeoCardDescription className="mt-2 text-base">
              {election.description}
            </NeoCardDescription>
          )}
        </NeoCardHeader>
        <NeoCardContent>
          <ElectionPhaseTimeline
            status={election.status}
            nominationsOpenAt={election.nominationsOpenAt}
            nominationsCloseAt={election.nominationsCloseAt}
            votingOpenAt={election.votingOpenAt}
            votingCloseAt={election.votingCloseAt}
            certifiedAt={election.certifiedAt}
          />
        </NeoCardContent>
      </NeoCard>

      {/* ---- CTA Banner ---- */}
      {isNominationsOpen && isMember && (
        <Card
          depth={2}
          className="border-l-4 border-l-sky-500 bg-sky-50/50 dark:bg-sky-900/20"
        >
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <div>
                <p className="font-medium text-sky-900 dark:text-sky-100">
                  Nominations are open!
                </p>
                <p className="text-sm text-sky-700 dark:text-sky-300">
                  Nominate a candidate for any open position.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                document.getElementById("nomination-form")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Nominate
            </Button>
          </CardContent>
        </Card>
      )}

      {isVotingOpen && isMember && !hasVoted && (
        <Card
          depth={2}
          className="border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
        >
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Vote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">
                  Voting is open!
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Cast your ranked-choice ballot now.
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/elections/${election.slug}/vote`}>
                <Vote className="mr-2 h-4 w-4" />
                Vote Now
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isMember && isUser && (
        <Card
          depth={2}
          className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/20"
        >
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Sign in as a member to participate in this election.
            </p>
          </CardContent>
        </Card>
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

      {/* ---- Main grid ---- */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ---- Left: Positions & Candidates ---- */}
        <div className="space-y-6 lg:col-span-3">
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
                        className="block"
                      >
                        <Card
                          depth={3}
                          className="p-4 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
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
                          </div>
                        </Card>
                      </Link>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ---- Right sidebar ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Participation panel */}
          <Card depth={2}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nominations</span>
                  <span className="font-medium">{totalNominations}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ballots cast</span>
                  <span className="font-medium">{election.ballots.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Election info */}
          <Card depth={2}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Election Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip
                    content={
                      <p>
                        Instant Runoff Voting (IRV): Voters rank candidates in
                        order of preference. If no candidate wins a majority,
                        the candidate with the fewest votes is eliminated and
                        their votes are redistributed until a winner emerges.
                      </p>
                    }
                    size="lg"
                  >
                    <span className="text-muted-foreground underline decoration-dotted cursor-help">
                      Voting system
                    </span>
                  </Tooltip>
                  <Badge variant="outline">IRV</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Positions</span>
                  <span className="font-medium">{election.offices.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results link (certified) */}
          {isCertified && (
            <Card depth={2}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Trophy className="h-8 w-8 text-violet-500" />
                  <p className="font-medium">Results are available</p>
                  <Button asChild className="w-full">
                    <Link href={`/elections/${election.slug}/results`}>
                      <Trophy className="mr-2 h-4 w-4" />
                      View Results
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nomination form (sidebar) */}
          {showNominationForm && (
            <Card depth={2} id="nomination-form">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Nominate a Candidate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Office</Label>
                  <Select
                    value={selectedOfficeId}
                    onValueChange={setSelectedOfficeId}
                  >
                    <SelectTrigger>
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
                  <Label>Search for a user</Label>
                  <div className="flex gap-2">
                    <Input
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Name or email"
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

                {userResults.length > 0 && (
                  <div className="space-y-2">
                    {userResults.map((user) => {
                      const isSelected = selectedUserId === user.id;
                      return (
                        <Card
                          key={user.id}
                          depth={3}
                          className={`p-3 cursor-pointer transition-all ${
                            isSelected
                              ? "ring-2 ring-primary"
                              : "hover:ring-1 hover:ring-primary/30"
                          }`}
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
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
                        </Card>
                      );
                    })}
                  </div>
                )}

                <Button
                  onClick={submitNomination}
                  disabled={
                    !selectedOfficeId || !selectedUserId || submittingNomination
                  }
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Nomination
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
