"use client";

import Link from "next/link";
import {
  NeoCard,
  NeoCardHeader,
  NeoCardTitle,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ElectionStatusBadge } from "@/components/elections/ElectionStatusBadge";
import { StatCard } from "@/components/elections/StatCard";
import { ElectionEmptyState } from "@/components/elections/ElectionEmptyState";
import { IRVBarChart } from "@/components/elections/IRVBarChart";
import { IRVRoundTable } from "@/components/elections/IRVRoundTable";
import {
  ChevronRight,
  Vote,
  Users,
  TrendingUp,
  Award,
  Trophy,
  BarChart3,
  Table,
  Lock,
} from "lucide-react";
import type { SerializedElection } from "@/components/elections/types";
import type { IRVOfficeResult } from "@/components/elections/types";

/* ---------- Helpers ---------- */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "";
  return (first + last).toUpperCase();
}

/* ---------- Props ---------- */

interface Props {
  election: SerializedElection;
  results: IRVOfficeResult[];
  canView: boolean;
}

/* ---------- Component ---------- */

export default function ElectionResultsClient({
  election,
  results,
  canView,
}: Props) {
  const totalBallots = election.ballots.length;
  const totalPositions = election.offices.length;

  /* ---- Estimate eligible voters as unique ballot voters ---- */
  const uniqueVoters = new Set(election.ballots.map((b) => b.voterId));
  const eligibleVoters = uniqueVoters.size > 0 ? uniqueVoters.size : totalBallots;
  const turnout =
    eligibleVoters > 0
      ? Math.round((totalBallots / eligibleVoters) * 100)
      : 0;

  return (
    <div className="w-full space-y-6">
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

      {/* ---- Header Card ---- */}
      <NeoCard depth={1}>
        <NeoCardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <NeoCardTitle className="text-3xl">Election Results</NeoCardTitle>
            <ElectionStatusBadge status={election.status} />
          </div>
        </NeoCardHeader>
        <NeoCardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Ballots Cast"
              value={totalBallots}
              icon={<Vote className="h-5 w-5" />}
              iconBg="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
            />
            <StatCard
              label="Eligible Voters"
              value={eligibleVoters}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Turnout"
              value={`${turnout}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Positions"
              value={totalPositions}
              icon={<Award className="h-5 w-5" />}
            />
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* ---- Not yet available state ---- */}
      {!canView && (
        <NeoCard depth={1}>
          <NeoCardContent className="pt-6">
            <ElectionEmptyState
              title="Results not yet available"
              description="Election results will be published once the election is certified. Check back after voting closes and the results are reviewed."
              icon={<Lock className="h-16 w-16 text-muted-foreground/30" />}
            />
          </NeoCardContent>
        </NeoCard>
      )}

      {/* ---- Per-position results ---- */}
      {canView &&
        results.map((result) => (
          <NeoCard key={result.officeId} depth={1}>
            <NeoCardHeader>
              <NeoCardTitle className="text-2xl">
                {result.officeTitle}
              </NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent className="space-y-4">
              {/* ---- No candidates ---- */}
              {result.status === "no_candidates" && (
                <ElectionEmptyState
                  title="No candidates"
                  description="No eligible candidates ran for this position."
                />
              )}

              {/* ---- Tie ---- */}
              {result.status === "tie" && (
                <Card
                  depth={2}
                  className="border-l-4 border-l-amber-500 p-4"
                >
                  <CardContent className="p-0">
                    <p className="font-medium text-amber-700 dark:text-amber-300">
                      This position ended in an unresolved tie and requires a
                      runoff election.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* ---- Winner card ---- */}
              {result.winner && (
                <Card
                  depth={2}
                  className="border-l-4 border-l-emerald-500"
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-sm font-medium">
                        {getInitials(result.winner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                          Winner
                        </Badge>
                        <span className="font-display font-bold text-lg truncate">
                          {result.winner.name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Won in round {result.rounds.length} with{" "}
                        {result.winner.finalVotes} vote
                        {result.winner.finalVotes !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
                  </CardContent>
                </Card>
              )}

              {/* ---- Runner-up card ---- */}
              {result.runnerUp && (
                <Card depth={2} className="border-l-4 border-l-sky-500">
                  <CardContent className="flex items-center gap-4 p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-medium">
                        {getInitials(result.runnerUp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-sky-500 text-sky-700 dark:text-sky-300"
                        >
                          Runner-up
                        </Badge>
                        <span className="font-medium truncate">
                          {result.runnerUp.name}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ---- Chart / Table tabs ---- */}
              {result.rounds.length > 0 && (
                <Tabs defaultValue="chart" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="chart" className="gap-1.5">
                      <BarChart3 className="h-4 w-4" />
                      Chart
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-1.5">
                      <Table className="h-4 w-4" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="chart">
                    <IRVBarChart
                      rounds={result.rounds}
                      totalBallots={result.totalBallots}
                    />
                  </TabsContent>
                  <TabsContent value="table">
                    <IRVRoundTable
                      rounds={result.rounds}
                      totalBallots={result.totalBallots}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </NeoCardContent>
          </NeoCard>
        ))}
    </div>
  );
}
