"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, Vote, GitMerge, FileText, Shield } from "lucide-react";
import AmendmentStatusBadge from "@/components/amendments/AmendmentStatusBadge";
import type { AmendmentStatus } from "@prisma/client";

type AmendmentRow = {
  id: number;
  title: string;
  status: AmendmentStatus;
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
  author?: { name: string | null };
};

type AmendmentDashboardStatsProps = {
  amendments: AmendmentRow[];
  roleName: string;
};

export default function AmendmentDashboardStats({
  amendments,
  roleName,
}: AmendmentDashboardStatsProps) {
  const counts = {
    OPEN: amendments.filter((a) => a.status === "OPEN").length,
    PRIMARY_REVIEW: amendments.filter((a) => a.status === "PRIMARY_REVIEW").length,
    VOTING: amendments.filter((a) => a.status === "VOTING").length,
    APPROVED: amendments.filter((a) => a.status === "APPROVED").length,
    MERGED: amendments.filter((a) => a.status === "MERGED").length,
    REJECTED: amendments.filter((a) => a.status === "REJECTED").length,
    TOTAL: amendments.length,
  };

  const needsAttention = amendments.filter(
    (a) => a.status === "OPEN" || a.status === "PRIMARY_REVIEW" || a.status === "VOTING" || a.status === "APPROVED"
  );

  const statTiles = [
    {
      label: "Open Forum",
      count: counts.OPEN,
      icon: FileText,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
      tooltip: "Amendments in public discussion phase",
    },
    {
      label: "Primary Review",
      count: counts.PRIMARY_REVIEW,
      icon: Shield,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
      tooltip: "Amendments being reviewed by primary officers",
    },
    {
      label: "Active Voting",
      count: counts.VOTING,
      icon: Vote,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      tooltip: "Amendments currently being voted on",
    },
    {
      label: "Awaiting Merge",
      count: counts.APPROVED,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      tooltip: "Approved amendments waiting to be merged",
    },
    {
      label: "Merged",
      count: counts.MERGED,
      icon: GitMerge,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
      tooltip: "Amendments merged into the constitution",
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Stats row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {statTiles.map((tile) => (
            <Tooltip key={tile.label}>
              <TooltipTrigger asChild>
                <Card depth={2} className="p-4 cursor-help transition-colors hover:bg-surface-3/50">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${tile.bg}`}>
                      <tile.icon className={`h-4 w-4 ${tile.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-display font-bold tabular-nums leading-none">
                        {tile.count}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{tile.label}</p>
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tile.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Needs attention */}
        {needsAttention.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h3 className="font-display font-semibold text-sm">
                Requires Your Attention
              </h3>
              <span className="text-xs text-muted-foreground">as {roleName}</span>
            </div>
            <div className="space-y-2">
              {needsAttention.slice(0, 5).map((amendment) => (
                <Card key={amendment.id} depth={3} className="p-3 flex items-center gap-3">
                  <AmendmentStatusBadge status={amendment.status} />
                  <Link
                    href={`/about/constitution/amendments/${amendment.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate flex-1"
                  >
                    {amendment.title}
                  </Link>
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/about/constitution/amendments/${amendment.id}`}>
                      Review
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {needsAttention.length === 0 && (
          <Card depth={3} className="p-6 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500/60 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              All caught up! No amendments require your action right now.
            </p>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
