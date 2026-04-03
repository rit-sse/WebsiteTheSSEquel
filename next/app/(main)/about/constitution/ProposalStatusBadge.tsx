"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  PRIMARY_REVIEW:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  SCHEDULED:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  OPEN: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  PASSED:
    "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",
  FAILED: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  APPLIED:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  WITHDRAWN:
    "border-stone-500/30 bg-stone-500/10 text-stone-700 dark:text-stone-300",
  STALE: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
};

export function ProposalStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`font-mono tracking-wide ${STATUS_STYLES[status] ?? ""}`}
    >
      {status}
    </Badge>
  );
}
