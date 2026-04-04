"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { IRVRound } from "./types";

/* ---------- Color palette ---------- */

const CANDIDATE_COLORS = [
  { bar: "bg-sky-500", text: "text-sky-700 dark:text-sky-300" },
  { bar: "bg-violet-500", text: "text-violet-700 dark:text-violet-300" },
  { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  { bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
  { bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  { bar: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-300" },
  { bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-300" },
  { bar: "bg-teal-500", text: "text-teal-700 dark:text-teal-300" },
] as const;

function getColor(index: number) {
  return CANDIDATE_COLORS[index % CANDIDATE_COLORS.length]!;
}

/* ---------- Props ---------- */

interface IRVBarChartProps {
  rounds: IRVRound[];
  totalBallots: number;
}

/* ---------- Component ---------- */

export function IRVBarChart({ rounds, totalBallots }: IRVBarChartProps) {
  /* Build stable color mapping by nomination order from round 1 */
  const colorMap = useMemo(() => {
    const map = new Map<number, (typeof CANDIDATE_COLORS)[number]>();
    if (rounds.length === 0) return map;
    const firstRound = rounds[0]!;
    const sorted = [...firstRound.counts].sort((a, b) => b.votes - a.votes);
    sorted.forEach((entry, i) => {
      map.set(entry.nominationId, getColor(i));
    });
    return map;
  }, [rounds]);

  const majorityThreshold = Math.floor(totalBallots / 2) + 1;
  const maxVotes = useMemo(() => {
    let max = 0;
    for (const round of rounds) {
      for (const entry of round.counts) {
        if (entry.votes > max) max = entry.votes;
      }
    }
    return Math.max(max, majorityThreshold, 1);
  }, [rounds, majorityThreshold]);

  if (rounds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No round data available.
      </p>
    );
  }

  const majorityPct = (majorityThreshold / maxVotes) * 100;

  return (
    <div className="space-y-6 py-4">
      {rounds.map((round) => {
        const sorted = [...round.counts].sort((a, b) => b.votes - a.votes);

        return (
          <div key={round.roundNumber} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Round {round.roundNumber}
            </h3>

            <div className="space-y-2">
              {sorted.map((entry) => {
                const color = colorMap.get(entry.nominationId) ?? getColor(0);
                const widthPct = maxVotes > 0 ? (entry.votes / maxVotes) * 100 : 0;

                return (
                  <div
                    key={entry.nominationId}
                    className={cn(
                      "flex items-center gap-3",
                      entry.eliminated && "opacity-50"
                    )}
                  >
                    {/* Candidate name */}
                    <div className="w-28 sm:w-36 shrink-0 text-right">
                      <span
                        className={cn(
                          "text-sm font-medium truncate block",
                          color.text,
                          entry.eliminated && "line-through"
                        )}
                      >
                        {entry.candidateName}
                      </span>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative h-8">
                      {/* Majority threshold line */}
                      <div
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-emerald-500/50 z-10 pointer-events-none"
                        style={{ left: `${majorityPct}%` }}
                      />
                      <div
                        className={cn(
                          "h-full rounded-r-md flex items-center transition-all duration-500 ease-out",
                          color.bar,
                          entry.eliminated && "opacity-60"
                        )}
                        style={{
                          width: `${widthPct}%`,
                          minWidth: entry.votes > 0 ? "2rem" : "0",
                        }}
                      >
                        <span className="text-xs font-bold text-white px-2 whitespace-nowrap">
                          {entry.votes}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Majority threshold label */}
              <div className="flex items-center gap-3">
                <div className="w-28 sm:w-36 shrink-0" />
                <div className="flex-1 relative h-4">
                  <div
                    className="absolute top-0 text-[10px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-medium"
                    style={{ left: `${majorityPct}%`, transform: "translateX(-50%)" }}
                  >
                    {majorityThreshold} to win
                  </div>
                </div>
              </div>
            </div>

            {/* Eliminated label */}
            {round.eliminatedNominationId !== null && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                Eliminated:{" "}
                {round.counts.find(
                  (c) => c.nominationId === round.eliminatedNominationId
                )?.candidateName ?? "Unknown"}
              </p>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500/50" />
          <span>Majority threshold ({majorityThreshold})</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-4 h-3 rounded-sm bg-muted opacity-50" />
          <span className="line-through">Eliminated</span>
        </div>
      </div>
    </div>
  );
}
