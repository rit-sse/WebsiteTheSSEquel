"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Info,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  NeoCard,
  NeoCardHeader,
  NeoCardTitle,
  NeoCardDescription,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

/* ---------- Types ---------- */

interface BallotNominee {
  id: number;
  name: string;
  email: string;
}

interface BallotNomination {
  id: number;
  nomineeUserId: number;
  statement: string;
  nominee: BallotNominee;
}

interface BallotOffice {
  id: number;
  officerPosition: {
    id: number;
    title: string;
    is_primary: boolean;
    email: string;
  };
  nominations: BallotNomination[];
}

interface BallotRanking {
  electionOfficeId: number;
  nominationId: number;
  rank: number;
}

interface BallotData {
  electionId: number;
  title: string;
  slug: string;
  status: string;
  presidentOnlyBallot: boolean;
  isEligibleVoter: boolean;
  offices: BallotOffice[];
  ballot: {
    id: number;
    rankings: BallotRanking[];
  } | null;
}

/* ---------- Helpers ---------- */

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ---------- Per-office state ---------- */

interface OfficeRankState {
  ranked: BallotNomination[];
  unranked: BallotNomination[];
}

function buildInitialRankState(
  offices: BallotOffice[],
  existingRankings: BallotRanking[]
): Record<number, OfficeRankState> {
  const result: Record<number, OfficeRankState> = {};

  for (const office of offices) {
    const officeRankings = existingRankings
      .filter((r) => r.electionOfficeId === office.id)
      .sort((a, b) => a.rank - b.rank);

    const ranked: BallotNomination[] = [];
    const rankedIds = new Set<number>();

    for (const ranking of officeRankings) {
      const nomination = office.nominations.find(
        (n) => n.id === ranking.nominationId
      );
      if (nomination) {
        ranked.push(nomination);
        rankedIds.add(nomination.id);
      }
    }

    const unranked = office.nominations.filter((n) => !rankedIds.has(n.id));
    result[office.id] = { ranked, unranked };
  }

  return result;
}

/* ---------- Component ---------- */

interface Props {
  electionId: number;
}

export default function ElectionVoteClient({ electionId }: Props) {
  const [data, setData] = useState<BallotData | null>(null);
  const [saving, setSaving] = useState(false);
  const [rankState, setRankState] = useState<Record<number, OfficeRankState>>(
    {}
  );
  const [hasExistingBallot, setHasExistingBallot] = useState(false);

  // Load ballot data
  useEffect(() => {
    fetch(`/api/elections/${electionId}/ballot`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error((await response.text()) || "Failed to load ballot");
        }
        return response.json();
      })
      .then((payload: BallotData) => {
        setData(payload);
        setHasExistingBallot(
          payload.ballot !== null && payload.ballot.rankings.length > 0
        );
        setRankState(
          buildInitialRankState(
            payload.offices,
            payload.ballot?.rankings ?? []
          )
        );
      })
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to load ballot"
        )
      );
  }, [electionId]);

  // Rank manipulation helpers
  const addToRanked = useCallback(
    (officeId: number, nominationId: number) => {
      setRankState((prev) => {
        const state = prev[officeId];
        if (!state) return prev;
        const nomination = state.unranked.find((n) => n.id === nominationId);
        if (!nomination) return prev;
        return {
          ...prev,
          [officeId]: {
            ranked: [...state.ranked, nomination],
            unranked: state.unranked.filter((n) => n.id !== nominationId),
          },
        };
      });
    },
    []
  );

  const removeFromRanked = useCallback(
    (officeId: number, nominationId: number) => {
      setRankState((prev) => {
        const state = prev[officeId];
        if (!state) return prev;
        const nomination = state.ranked.find((n) => n.id === nominationId);
        if (!nomination) return prev;
        return {
          ...prev,
          [officeId]: {
            ranked: state.ranked.filter((n) => n.id !== nominationId),
            unranked: [...state.unranked, nomination],
          },
        };
      });
    },
    []
  );

  const moveUp = useCallback((officeId: number, index: number) => {
    if (index === 0) return;
    setRankState((prev) => {
      const state = prev[officeId];
      if (!state) return prev;
      const newRanked = [...state.ranked];
      [newRanked[index - 1], newRanked[index]] = [
        newRanked[index],
        newRanked[index - 1],
      ];
      return { ...prev, [officeId]: { ...state, ranked: newRanked } };
    });
  }, []);

  const moveDown = useCallback(
    (officeId: number, index: number) => {
      setRankState((prev) => {
        const state = prev[officeId];
        if (!state) return prev;
        if (index >= state.ranked.length - 1) return prev;
        const newRanked = [...state.ranked];
        [newRanked[index], newRanked[index + 1]] = [
          newRanked[index + 1],
          newRanked[index],
        ];
        return { ...prev, [officeId]: { ...state, ranked: newRanked } };
      });
    },
    []
  );

  // Completion stats
  const { positionsRanked, totalPositions, progressPercent } = useMemo(() => {
    if (!data) return { positionsRanked: 0, totalPositions: 0, progressPercent: 0 };
    const total = data.offices.length;
    const ranked = data.offices.filter(
      (office) => (rankState[office.id]?.ranked.length ?? 0) > 0
    ).length;
    return {
      positionsRanked: ranked,
      totalPositions: total,
      progressPercent: total > 0 ? Math.round((ranked / total) * 100) : 0,
    };
  }, [data, rankState]);

  // Save ballot
  const saveBallot = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const payload = {
        rankings: data.offices.map((office) => ({
          electionOfficeId: office.id,
          nominationIds: (rankState[office.id]?.ranked ?? []).map(
            (nomination) => nomination.id
          ),
        })),
      };

      const response = await fetch(`/api/elections/${electionId}/ballot`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error((await response.text()) || "Failed to save ballot");
      }
      setHasExistingBallot(true);
      toast.success("Ballot saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save ballot"
      );
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (!data) {
    return (
      <NeoCard depth={1}>
        <NeoCardContent className="flex items-center justify-center gap-3 p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading ballot...</span>
        </NeoCardContent>
      </NeoCard>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header */}
      <NeoCard depth={1}>
        <NeoCardHeader>
          <NeoCardTitle>Cast Your Ballot</NeoCardTitle>
          <NeoCardDescription>{data.title}</NeoCardDescription>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          {/* Info banner */}
          <div className="flex gap-3 rounded-lg bg-surface-2 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Ranked Choice Voting</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Rank candidates in order of preference (1 = most preferred). You
                do not need to rank every candidate.
              </p>
            </div>
          </div>

          {/* Already voted banner */}
          {hasExistingBallot && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50/50 p-4 dark:bg-emerald-900/20">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                You have already voted. You may update your ballot.
              </p>
            </div>
          )}

          {/* President-only note */}
          {data.presidentOnlyBallot && (
            <div className="flex gap-3 rounded-lg bg-surface-2 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                President and Vice President share the same approved slate, so
                the Vice President ballot is suppressed and the President
                runner-up becomes Vice President.
              </p>
            </div>
          )}
        </NeoCardContent>
      </NeoCard>

      {/* Per-position cards */}
      {data.offices.map((office, officeIndex) => {
        const state = rankState[office.id] ?? { ranked: [], unranked: [] };

        return (
          <NeoCard key={office.id} depth={1}>
            <NeoCardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {officeIndex + 1}
                </div>
                <h2 className="font-display text-xl">
                  {office.officerPosition.title}
                </h2>
              </div>
            </NeoCardHeader>
            <NeoCardContent className="space-y-4">
              {/* Ranked candidates */}
              {state.ranked.length > 0 && (
                <div className="space-y-2">
                  {state.ranked.map((nomination, index) => (
                    <Card
                      key={nomination.id}
                      depth={2}
                      className="flex items-center gap-4 p-3"
                    >
                      {/* Rank number */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(nomination.nominee.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name + statement excerpt */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {nomination.nominee.name}
                        </p>
                        {nomination.statement && (
                          <p className="truncate text-xs text-muted-foreground">
                            {nomination.statement}
                          </p>
                        )}
                      </div>

                      {/* Reorder + remove buttons */}
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === 0}
                          onClick={() => moveUp(office.id, index)}
                          aria-label={`Move ${nomination.nominee.name} up`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === state.ranked.length - 1}
                          onClick={() => moveDown(office.id, index)}
                          aria-label={`Move ${nomination.nominee.name} down`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            removeFromRanked(office.id, nomination.id)
                          }
                          aria-label={`Remove ${nomination.nominee.name} from ranking`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Unranked pool */}
              {state.unranked.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Not ranked &mdash; click to add
                  </p>
                  {state.unranked.map((nomination) => (
                    <Card
                      key={nomination.id}
                      depth={3}
                      className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-surface-3/50"
                      onClick={() => addToRanked(office.id, nomination.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          addToRanked(office.id, nomination.id);
                        }
                      }}
                      aria-label={`Add ${nomination.nominee.name} to ranking`}
                    >
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(nomination.nominee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {nomination.nominee.name}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {office.nominations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No eligible candidates for this position.
                </p>
              )}
            </NeoCardContent>
          </NeoCard>
        );
      })}

      {/* Submit section */}
      <NeoCard depth={1}>
        <NeoCardContent className="space-y-4 pt-6">
          {/* Completion info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {positionsRanked} of {totalPositions} position
              {totalPositions !== 1 ? "s" : ""} ranked
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <Progress value={progressPercent} />

          {/* Submit button */}
          <Button
            onClick={saveBallot}
            disabled={saving || positionsRanked === 0}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Submit Ballot"
            )}
          </Button>
        </NeoCardContent>
      </NeoCard>
    </div>
  );
}
