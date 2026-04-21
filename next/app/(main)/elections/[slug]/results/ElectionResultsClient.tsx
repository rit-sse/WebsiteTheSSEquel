"use client";

import Link from "next/link";
import { NeoCard, NeoCardContent } from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ElectionStatusBadge } from "@/components/elections/ElectionStatusBadge";
import { electionAvatarStyle } from "@/components/elections/electionAvatarColor";
import { compareByPrimaryOrder } from "@/lib/elections";
import { ElectionEmptyState } from "@/components/elections/ElectionEmptyState";
import { IRVSankey } from "@/components/elections/IRVSankey";
import {
  ChevronRight,
  Trophy,
  Check,
  Clock,
  Lock,
  Crown,
  Coins,
  BookOpen,
  NotebookText,
  Shield,
  User,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import type { SerializedElection } from "@/components/elections/types";
import type { IRVOfficeResult } from "@/components/elections/types";

/* ---------- Helpers ---------- */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "";
  return (first + last).toUpperCase();
}

function PositionIcon({
  title,
  size = 14,
}: {
  title: string;
  size?: number;
}) {
  const Icon =
    title === "President"
      ? Crown
      : title === "Vice President"
        ? Shield
        : title === "Secretary"
          ? NotebookText
          : title === "Treasurer"
            ? Coins
            : title === "Mentoring Head"
              ? BookOpen
              : User;
  return <Icon size={size} />;
}

/* ---------- Props ---------- */

interface Props {
  election: SerializedElection;
  results: IRVOfficeResult[];
  canView: boolean;
  /** True only for SE Office users when the election is VOTING_CLOSED. */
  canCertify: boolean;
}

/* ---------- Component ---------- */

export default function ElectionResultsClient({
  election,
  results,
  canView,
  canCertify,
}: Props) {
  const [certifying, setCertifying] = useState(false);
  const totalBallots = election.ballots.length;
  const totalPositions = election.offices.length;
  const unresolvedTie = results.some((r) => r.status === "tie");
  const isCertified = election.status === "CERTIFIED";

  // Office tab selector — defaults to the first office with a winner
  // (or the first office overall). Keyed by officeId.
  const firstResultId =
    results.find((r) => r.winner)?.officeId ?? results[0]?.officeId ?? null;
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(
    firstResultId
  );
  const selected =
    results.find((r) => r.officeId === selectedOfficeId) ?? results[0] ?? null;

  const certify = async () => {
    setCertifying(true);
    try {
      const response = await fetch(`/api/elections/${election.id}/certify`, {
        method: "POST",
      });
      if (!response.ok) {
        toast.error((await response.text()) || "Failed to certify");
        return;
      }
      toast.success("Election certified — results are now public.");
      if (typeof window !== "undefined") window.location.reload();
    } catch {
      toast.error("Failed to certify");
    } finally {
      setCertifying(false);
    }
  };

  /* ---- Estimate eligible voters as unique ballot voters ---- */
  const uniqueVoters = new Set(election.ballots.map((b) => b.voterId));
  const eligibleVoters = uniqueVoters.size > 0 ? uniqueVoters.size : totalBallots;
  const turnout =
    eligibleVoters > 0
      ? Math.round((totalBallots / eligibleVoters) * 100)
      : 0;

  // Presidential winner — emphasized (inside its own Card), always rendered
  // above the other offices.
  const presidentWinner = results.find(
    (r) => r.officeTitle === "President" && r.winner
  );
  // Everyone else — VP included so the four non-presidential primaries all
  // appear side-by-side. Sorted by the canonical primary-office order
  // (VP → Treasurer → Secretary → Mentoring Head).
  const otherWinners = results
    .filter((r) => r.winner && r.officeTitle !== "President")
    .sort((a, b) =>
      compareByPrimaryOrder(a.officeTitle, b.officeTitle)
    );

  return (
    <div className="election-scope w-full space-y-6">
      {/* ---- Breadcrumbs ---- */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/elections"
          className="hover:text-foreground transition-colors"
        >
          Elections
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/elections/${election.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {election.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Results</span>
      </nav>

      {/* ---- Whole page on one outer NeoCard. Inner sections are plain
             Card primitives with elevated depths and no neo borders. ---- */}
      <NeoCard depth={1}>
        <NeoCardContent className="space-y-6 p-6 md:p-8">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold">
                Election Results
              </h1>
              <ElectionStatusBadge status={election.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {totalBallots} ballot{totalBallots !== 1 ? "s" : ""} cast of{" "}
              {eligibleVoters} eligible voter
              {eligibleVoters !== 1 ? "s" : ""} ({turnout}% turnout) across{" "}
              {totalPositions} position{totalPositions !== 1 ? "s" : ""}.
            </p>
          </header>

          {/* ---- SE Office certification panel (VOTING_CLOSED → CERTIFIED) ---- */}
          {canCertify && (
            <Card depth={2} className="space-y-5 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow">SE Office · Certification</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">
                    Review every office before certifying.
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The SE Office certifies the final results for all{" "}
                    {totalPositions} positions. Voting is closed and the
                    instant-runoff tally is ready below &mdash; confirm the
                    winners, then publish.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 border-t border-border/40 pt-4">
                <NeoBrutalistButton
                  text={certifying ? "Certifying…" : "Certify & publish"}
                  variant="green"
                  icon={
                    certifying ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-[18px] w-[18px]" />
                    )
                  }
                  onClick={certify}
                  disabled={certifying || unresolvedTie}
                />
                {unresolvedTie && (
                  <p className="text-sm font-medium text-amber-600">
                    One or more offices ended in a tie &mdash; a runoff is
                    required before certification.
                  </p>
                )}
                {!unresolvedTie && (
                  <p className="text-xs text-muted-foreground">
                    Once certified, results become visible to the whole
                    membership and winners are installed as officers.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* ---- Presidential ticket (emphasized) ---- */}
          {canView && presidentWinner?.winner && (
            <Card
              depth={2}
              className="cursor-pointer transition-colors hover:bg-surface-3"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOfficeId(presidentWinner.officeId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedOfficeId(presidentWinner.officeId);
                }
              }}
              aria-label={`View President results: ${presidentWinner.winner.name}`}
            >
              <div className="pres-ticket">
                {/* Left: President */}
                <div>
                  <span className="display-3 text-xl">President</span>
                  <div className="ticket-avatar-row mt-3">
                    <Avatar
                      className="h-12 w-12 border-2 border-black"
                      style={electionAvatarStyle(presidentWinner.winner.name)}
                    >
                      <AvatarFallback
                        className="font-display text-sm font-bold"
                        style={electionAvatarStyle(
                          presidentWinner.winner.name
                        )}
                      >
                        {getInitials(presidentWinner.winner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="ticket-name">
                        {presidentWinner.winner.name}
                      </div>
                      <div className="ticket-meta">
                        {presidentWinner.rounds.length} round
                        {presidentWinner.rounds.length === 1 ? "" : "s"}{" "}
                        &middot; {presidentWinner.winner.finalVotes} vote
                        {presidentWinner.winner.finalVotes === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ticket-sep" aria-hidden />

                {/* Right: Running mate */}
                <div>
                  <span className="display-3 text-xl">
                    Running mate &middot; VP
                  </span>
                  {presidentWinner.runningMate ? (
                    <div className="ticket-avatar-row mt-3">
                      <Avatar
                        className="h-12 w-12 border-2 border-black"
                        style={electionAvatarStyle(
                          presidentWinner.runningMate.name
                        )}
                      >
                        <AvatarFallback
                          className="font-display text-sm font-bold"
                          style={electionAvatarStyle(
                            presidentWinner.runningMate.name
                          )}
                        >
                          {getInitials(presidentWinner.runningMate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="ticket-name">
                          {presidentWinner.runningMate.name}
                        </div>
                        <div className="ticket-meta">
                          Elected on the winning presidential ticket.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="ticket-meta mt-3">
                      No running mate on the winning ticket.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* ---- Non-presidential primaries: 3-column grid of normal Cards ---- */}
          {canView && otherWinners.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {otherWinners.map((result) => {
                const isSelected = selected?.officeId === result.officeId;
                return (
                  <Card
                    key={result.officeId}
                    depth={3}
                    className={`cursor-pointer p-5 transition-colors hover:bg-surface-4 ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-1"
                        : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedOfficeId(result.officeId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedOfficeId(result.officeId);
                      }
                    }}
                  >
                    <span className="display-3 text-xl">
                      {result.officeTitle}
                    </span>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar
                        className="h-10 w-10 border-2 border-black"
                        style={electionAvatarStyle(result.winner!.name)}
                      >
                        <AvatarFallback
                          className="text-xs font-bold font-display"
                          style={electionAvatarStyle(result.winner!.name)}
                        >
                          {getInitials(result.winner!.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-display text-base font-bold">
                          {result.winner!.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.ticketDerived ? (
                            <>Elected on the presidential ticket</>
                          ) : (
                            <>
                              {result.rounds.length} round
                              {result.rounds.length === 1 ? "" : "s"} &middot;{" "}
                              {result.winner!.finalVotes} vote
                              {result.winner!.finalVotes === 1 ? "" : "s"}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ---- Not yet available state ---- */}
          {!canView && (
            <Card depth={2}>
              <div className="p-6">
                <ElectionEmptyState
                  title="Results not yet available"
                  description="Election results will be published once the election is certified. Check back after voting closes and the results are reviewed."
                  icon={
                    <Lock className="h-16 w-16 text-muted-foreground/30" />
                  }
                />
              </div>
            </Card>
          )}

          {/* ---- IRV detail card ---- */}
          {canView && selected && (
            <Card depth={2} className="space-y-4 p-6 md:p-8">
              {/* Eyebrow + title */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow inline-flex items-center gap-2">
                    <Trophy className="h-3 w-3" />{" "}
                    {isCertified ? "Final" : "Preliminary"} &middot;
                    Instant-runoff tally
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold">
                    Round-by-round results
                  </h3>
                </div>
                {isCertified ? (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1">
                    <Check className="h-3 w-3" /> Certified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-600 gap-1"
                  >
                    <Clock className="h-3 w-3" /> Pending certification
                  </Badge>
                )}
              </div>

              {/* Pill tabs — one per office */}
              <div className="neo-tabs">
                {results.map((r) => (
                  <button
                    key={r.officeId}
                    type="button"
                    className={`neo-tab${
                      selected.officeId === r.officeId ? " on" : ""
                    }`}
                    onClick={() => setSelectedOfficeId(r.officeId)}
                  >
                    {r.officeTitle}
                  </button>
                ))}
              </div>

              {/* Empty / tie states */}
              {selected.status === "no_candidates" && (
                <ElectionEmptyState
                  title="No candidates"
                  description="No eligible candidates ran for this position."
                />
              )}
              {selected.status === "tie" && (
                <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50/50 p-4 dark:bg-amber-900/20">
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    This position ended in an unresolved tie and requires a
                    runoff election.
                  </p>
                </div>
              )}

              {selected.winner && (
                <>
                  {/* Stat chip row */}
                  <div className="flex flex-wrap gap-3.5 pt-2">
                    <div className="stat-chip">
                      <div className="stat-chip-label">Winner</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Avatar
                          className="h-8 w-8 border-2 border-black"
                          style={electionAvatarStyle(selected.winner.name)}
                        >
                          <AvatarFallback
                            className="font-display text-[11px] font-bold"
                            style={electionAvatarStyle(selected.winner.name)}
                          >
                            {getInitials(selected.winner.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-display text-base font-bold">
                          {selected.winner.name}
                        </span>
                      </div>
                    </div>
                    <div className="stat-chip">
                      <div className="stat-chip-label">Rounds</div>
                      <div className="stat-chip-value">
                        {selected.ticketDerived ? "—" : selected.rounds.length}
                      </div>
                    </div>
                    <div className="stat-chip">
                      <div className="stat-chip-label">Ballots cast</div>
                      <div className="stat-chip-value">
                        {selected.totalBallots}
                      </div>
                    </div>
                    {selected.officeTitle === "President" &&
                      selected.runningMate && (
                        <div className="stat-chip">
                          <div className="stat-chip-label">
                            Running mate (VP)
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="pair">
                              <span
                                className="pair-avatar"
                                style={electionAvatarStyle(
                                  selected.runningMate.name
                                )}
                              >
                                {getInitials(selected.runningMate.name)}
                              </span>
                              {selected.runningMate.name}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Sankey or ticket-derived note */}
                  {selected.ticketDerived ? (
                    <div className="rounded-lg border border-black/30 bg-surface-2 p-4 text-sm text-muted-foreground">
                      VP is not tallied separately — elected as the running
                      mate on the winning presidential ticket.
                    </div>
                  ) : selected.rounds.length > 0 ? (
                    <>
                      <div className="sankey-wrap mt-2">
                        <IRVSankey rounds={selected.rounds} />
                      </div>
                      <div className="sankey-legend">
                        <span>
                          ◇ Solid color = votes stay with candidate across
                          rounds
                        </span>
                        <span className="is-elim">
                          ◇ Red = transferred after elimination
                        </span>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </Card>
          )}
        </NeoCardContent>
      </NeoCard>
    </div>
  );
}
