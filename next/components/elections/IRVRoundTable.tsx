"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { IRVRound } from "./types";

/* ---------- Props ---------- */

interface IRVRoundTableProps {
  rounds: IRVRound[];
  totalBallots: number;
}

/* ---------- Component ---------- */

export function IRVRoundTable({ rounds, totalBallots }: IRVRoundTableProps) {
  /* Build stable candidate list from first round, sorted by initial votes desc */
  const candidates = useMemo(() => {
    if (rounds.length === 0) return [];
    const firstRound = rounds[0]!;
    return [...firstRound.counts]
      .sort((a, b) => b.votes - a.votes)
      .map((entry) => ({
        nominationId: entry.nominationId,
        name: entry.candidateName,
      }));
  }, [rounds]);

  /* Determine which candidate won (last remaining in final round) */
  const winnerId = useMemo(() => {
    if (rounds.length === 0) return null;
    const lastRound = rounds[rounds.length - 1]!;
    const nonEliminated = lastRound.counts.filter((c) => !c.eliminated);
    if (nonEliminated.length === 0) return null;
    const sorted = [...nonEliminated].sort((a, b) => b.votes - a.votes);
    return sorted[0]?.nominationId ?? null;
  }, [rounds]);

  /* Track which candidates were eliminated in or before each round */
  const eliminatedByRound = useMemo(() => {
    const map = new Map<number, Set<number>>();
    const eliminatedSoFar = new Set<number>();
    for (const round of rounds) {
      if (round.eliminatedNominationId !== null) {
        eliminatedSoFar.add(round.eliminatedNominationId);
      }
      map.set(round.roundNumber, new Set(eliminatedSoFar));
    }
    return map;
  }, [rounds]);

  if (rounds.length === 0 || candidates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No round data available.
      </p>
    );
  }

  const majorityThreshold = Math.floor(totalBallots / 2) + 1;

  return (
    <div className="overflow-x-auto py-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            <th className="text-left font-medium text-muted-foreground py-2 pr-4 whitespace-nowrap">
              Candidate
            </th>
            {rounds.map((round) => (
              <th
                key={round.roundNumber}
                className="text-center font-medium text-muted-foreground py-2 px-3 whitespace-nowrap"
              >
                Round {round.roundNumber}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.nominationId} className="border-b border-border/20">
              <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                {candidate.name}
              </td>
              {rounds.map((round) => {
                const entry = round.counts.find(
                  (c) => c.nominationId === candidate.nominationId
                );
                const eliminated = eliminatedByRound
                  .get(round.roundNumber)
                  ?.has(candidate.nominationId);
                const justEliminated =
                  round.eliminatedNominationId === candidate.nominationId;
                const isWinnerFinal =
                  round.roundNumber === rounds.length &&
                  candidate.nominationId === winnerId;
                const wasEliminatedBefore =
                  !justEliminated && eliminated;

                /* Candidate was already eliminated in a previous round */
                if (wasEliminatedBefore) {
                  return (
                    <td
                      key={round.roundNumber}
                      className="text-center py-2.5 px-3 text-muted-foreground/40"
                    >
                      &mdash;
                    </td>
                  );
                }

                return (
                  <td
                    key={round.roundNumber}
                    className={cn(
                      "text-center py-2.5 px-3",
                      justEliminated &&
                        "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 line-through",
                      isWinnerFinal &&
                        "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-bold"
                    )}
                  >
                    {entry?.votes ?? 0}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Majority threshold row */}
          <tr className="border-t border-border/40">
            <td className="py-2.5 pr-4 text-xs text-muted-foreground font-medium">
              Majority needed
            </td>
            {rounds.map((round) => (
              <td
                key={round.roundNumber}
                className="text-center py-2.5 px-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium"
              >
                {majorityThreshold}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
