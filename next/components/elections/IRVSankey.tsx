"use client";

import { useMemo } from "react";
import type { IRVRound } from "./types";
import { pickElectionAvatarColor } from "./electionAvatarColor";

/**
 * Sankey-flow IRV diagram — a near-verbatim port of the Sankey in the
 * Claude Design handoff (`sse-primary-election-system/project/election/
 * app.jsx:289-413`). Each candidate becomes a colored vertical bar in
 * every round; curved ribbons flow from round to round showing which
 * votes stay with a candidate (solid color) vs which were transferred
 * after an elimination (the destructive-red dashed flow).
 *
 * Input shape matches the existing `IRVRound[]` used elsewhere in the
 * results page — we transform it to the prototype's per-round node list
 * and compute transfer distributions from round-over-round deltas, since
 * the server tally doesn't record individual ballot transfers.
 */

interface IRVSankeyProps {
  rounds: IRVRound[];
  width?: number;
  height?: number;
}

interface SankeyCandidate {
  id: number;
  name: string;
  color: string;
  votes: number;
  eliminated: boolean;
  /** For eliminated rows, the votes the candidate held when they were eliminated. */
  transferredFrom?: number;
  /** For eliminated rows, where those votes went in the next round. */
  transfers?: Array<{ id: number; n: number }>;
}

export function IRVSankey({
  rounds,
  width = 900,
  height = 360,
}: IRVSankeyProps) {
  const sankeyRounds = useMemo<SankeyCandidate[][]>(
    () => buildSankeyRounds(rounds),
    [rounds]
  );

  if (sankeyRounds.length === 0) return null;

  const R = sankeyRounds.length;
  const padL = 64;
  const padR = 140;
  const padT = 38;
  const padB = 24;
  const colW = (width - padL - padR) / Math.max(R, 1);
  const nodeW = 16;
  const gap = 6;

  // Max total across rounds so heights are consistent across rounds
  const rtotal = sankeyRounds.map((r) =>
    r.reduce(
      (a, c) => a + c.votes + (c.eliminated ? c.transferredFrom ?? 0 : 0),
      0
    )
  );
  const maxTotal = Math.max(...rtotal, 1);
  const avail = height - padT - padB;

  // Preserve stable vertical order by candidate name across rounds
  const allNames = [...new Set(sankeyRounds.flatMap((r) => r.map((c) => c.name)))];

  type LaidOut = SankeyCandidate & { x: number; y: number; w: number; h: number };
  // In each round, eliminated entries (post-elimination ghosts) are filtered
  // out of the layout so surviving bars reclaim the vertical space. Flow
  // computation still resolves their previous-round alive bar via
  // layout[ri].find(name === ...).
  const layout: LaidOut[][] = sankeyRounds.map((round, ri) => {
    const sorted = allNames
      .map((n) => round.find((c) => c.name === n))
      .filter(
        (c): c is SankeyCandidate => Boolean(c) && !(c as SankeyCandidate).eliminated
      );
    const x = padL + ri * colW;
    let y = padT;
    return sorted.map((c) => {
      const size = (c.votes / maxTotal) * (avail - gap * (sorted.length - 1));
      const node: LaidOut = {
        ...c,
        x,
        y,
        w: nodeW,
        h: Math.max(6, size),
      };
      y += node.h + gap;
      return node;
    });
  });

  // Build flows between consecutive rounds
  type Flow = {
    from: LaidOut;
    to: LaidOut;
    height: number;
    color: string;
    isTransfer: boolean;
    fromOffset: number;
    toOffset: number;
  };
  const flows: Flow[] = [];
  for (let ri = 0; ri < R - 1; ri++) {
    const cur = layout[ri]!;
    const next = layout[ri + 1]!;

    // Carry-over flows (non-eliminated stays same)
    for (const n of cur) {
      if (n.eliminated) continue;
      const nxt = next.find((nn) => nn.name === n.name);
      if (!nxt) continue;
      const carry = Math.min(n.votes, nxt.votes);
      if (carry > 0) {
        const carryH = (carry / Math.max(1, n.votes)) * n.h;
        flows.push({
          from: n,
          to: nxt,
          height: carryH,
          color: n.color,
          isTransfer: false,
          fromOffset: 0,
          toOffset: 0,
        });
      }
    }

    // Eliminated → transfer flows
    const eliminated = sankeyRounds[ri + 1]!.find((c) => c.eliminated);
    if (eliminated && eliminated.transfers) {
      const elimNode = cur.find((n) => n.name === eliminated.name);
      if (elimNode) {
        let offset = 0;
        for (const t of eliminated.transfers) {
          const targetName = sankeyRounds[ri + 1]!.find(
            (c) => c.id === t.id
          )?.name;
          const target = next.find((n) => n.name === targetName);
          if (!target || t.n <= 0) continue;
          const frac = t.n / Math.max(1, eliminated.transferredFrom ?? 1);
          const h = frac * elimNode.h;
          flows.push({
            from: elimNode,
            to: target,
            height: h,
            fromOffset: offset,
            toOffset:
              ((target.votes - t.n) / Math.max(1, target.votes)) * target.h,
            color: elimNode.color,
            isTransfer: true,
          });
          offset += h;
        }
      }
    }
  }

  const flowPath = (f: Flow): string => {
    const x1 = f.from.x + f.from.w;
    const x2 = f.to.x;
    const y1 = f.from.y + f.fromOffset;
    const y2 = f.to.y + f.toOffset;
    const h1 = f.height;
    const h2 = f.height;
    const mx = (x1 + x2) / 2;
    return `
      M ${x1} ${y1}
      C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}
      L ${x2} ${y2 + h2}
      C ${mx} ${y2 + h2}, ${mx} ${y1 + h1}, ${x1} ${y1 + h1}
      Z`;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="sankey-svg"
      style={{ width: "100%", minWidth: 600 }}
    >
      {/* Round labels */}
      {sankeyRounds.map((_, ri) => (
        <g key={ri}>
          <text
            x={padL + ri * colW + nodeW / 2}
            y={20}
            textAnchor="middle"
            className="sankey-round-label"
          >
            Round {ri + 1}
          </text>
        </g>
      ))}

      {/* Flows */}
      {flows.map((f, i) => (
        <path
          key={i}
          d={flowPath(f)}
          className={`sankey-flow ${f.isTransfer ? "elim" : ""}`}
          fill={f.isTransfer ? undefined : f.color}
        />
      ))}

      {/* Nodes — ghost (eliminated) nodes in post-elimination rounds are
          intentionally suppressed. The red transfer ribbons already
          convey the elimination visually; the greyed rect + strikethrough
          text were noise. Flows still work because they source from the
          previous round's alive bar (layout[ri].find(...)). */}
      {layout.flatMap((round, ri) =>
        round
          .filter((n) => !n.eliminated)
          .map((n) => (
            <g key={`${ri}-${n.id}`} className="sankey-node">
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                fill={n.color}
                rx={2}
              />
              {ri === layout.length - 1 && (
                <text
                  x={n.x + n.w + 8}
                  y={n.y + n.h / 2 + 4}
                  fill="currentColor"
                >
                  {n.name}
                  <tspan
                    x={n.x + n.w + 8}
                    dy={14}
                    fill="hsl(var(--muted-foreground))"
                    fontSize={11}
                  >
                    {`${n.votes} votes`}
                  </tspan>
                </text>
              )}
              {ri === 0 && (
                <text
                  x={n.x - 8}
                  y={n.y + n.h / 2 + 4}
                  textAnchor="end"
                  fill="currentColor"
                  fontSize={11}
                >
                  {n.name.split(" ")[0]}
                </text>
              )}
            </g>
          ))
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------- */
/* Transform the server tally rounds into the prototype's Sankey shape.  */
/*                                                                        */
/* Server tally shape (N rounds for N eliminations):                     */
/*   rounds[i] = { counts: [...current votes], eliminatedNominationId }  */
/* Design Sankey shape (N+1 rounds):                                     */
/*   sankeyRounds[0] = everyone alive with first-pref totals             */
/*   sankeyRounds[i>0] = survivors (new totals) + the just-eliminated    */
/*                      candidate with eliminated=true, transferredFrom, */
/*                      and transfers=[deltas to each survivor]          */
/*                                                                        */
/* The mismatch was the reason Sam's red-dashed transfer ribbons weren't */
/* rendering — the prototype's Sankey looks for `eliminated` nodes in    */
/* the *next* round, not the current one.                                */
/* -------------------------------------------------------------------- */

function buildSankeyRounds(rounds: IRVRound[]): SankeyCandidate[][] {
  if (rounds.length === 0) return [];

  const result: SankeyCandidate[][] = [];

  // Initial round: all candidates alive with first-preference totals
  // (server's rounds[0].counts is exactly that snapshot).
  const firstRound = rounds[0];
  if (!firstRound) return [];
  result.push(
    firstRound.counts.map((c) => ({
      id: c.nominationId,
      name: c.candidateName,
      color: pickElectionAvatarColor(c.nominationId),
      votes: c.votes,
      eliminated: false,
    }))
  );

  // For each elimination round in the server tally, emit a "post-elim"
  // round: survivors with their new totals plus the just-eliminated
  // candidate with the transfer breakdown computed from deltas.
  for (let i = 0; i < rounds.length; i++) {
    const current = rounds[i]!;
    const next = i + 1 < rounds.length ? rounds[i + 1] : null;
    const eliminatedId = current.eliminatedNominationId;
    if (eliminatedId == null) continue;

    const eliminatedEntry = current.counts.find(
      (c) => c.nominationId === eliminatedId
    );
    if (!eliminatedEntry) continue;
    const eliminatedVotes = eliminatedEntry.votes;

    // Survivor counts AFTER this elimination. If there's a next tally
    // round, its `counts` already reflects the transfer. For the final
    // elimination there's no next round, so the sole survivor receives
    // everything — compute their new total as current + transferred.
    const survivorCounts: Array<{
      nominationId: number;
      candidateName: string;
      votes: number;
    }> = next
      ? next.counts.map((c) => ({
          nominationId: c.nominationId,
          candidateName: c.candidateName,
          votes: c.votes,
        }))
      : current.counts
          .filter((c) => c.nominationId !== eliminatedId)
          .map((c) => ({
            nominationId: c.nominationId,
            candidateName: c.candidateName,
            // Only one survivor at the final elimination — give them all
            // of the eliminated candidate's transferable votes.
            votes:
              c.votes +
              (current.counts.filter((x) => x.nominationId !== eliminatedId)
                .length === 1
                ? eliminatedVotes
                : 0),
          }));

    // Transfer breakdown: delta per survivor from current → post-elim.
    const currentById = new Map<number, number>();
    for (const c of current.counts) currentById.set(c.nominationId, c.votes);
    const transfers: Array<{ id: number; n: number }> = [];
    for (const s of survivorCounts) {
      const prior = currentById.get(s.nominationId) ?? 0;
      const gained = Math.max(0, s.votes - prior);
      if (gained > 0) transfers.push({ id: s.nominationId, n: gained });
    }

    // If the sum of gained deltas doesn't equal the eliminated votes
    // (e.g. because some ballots had no next preference and exhausted),
    // the remainder just visually disappears — that matches the design's
    // behaviour (ribbons shrink to match the eliminated bar's height).

    result.push([
      ...survivorCounts.map<SankeyCandidate>((s) => ({
        id: s.nominationId,
        name: s.candidateName,
        color: pickElectionAvatarColor(s.nominationId),
        votes: s.votes,
        eliminated: false,
      })),
      {
        id: eliminatedId,
        name: eliminatedEntry.candidateName,
        color: pickElectionAvatarColor(eliminatedId),
        votes: 0,
        eliminated: true,
        transferredFrom: eliminatedVotes,
        transfers,
      },
    ]);
  }

  return result;
}
