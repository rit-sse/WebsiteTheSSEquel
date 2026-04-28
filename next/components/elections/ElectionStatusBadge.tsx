import { cn } from "@/lib/utils";
import type { ElectionStatus } from "./types";

const statusConfig: Record<
  ElectionStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  NOMINATIONS_OPEN: {
    label: "Nominations Open",
    bg: "bg-sky-50 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500 animate-pulse",
  },
  NOMINATIONS_CLOSED: {
    label: "Nominations Closed",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  VOTING_OPEN: {
    label: "Voting Open",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500 animate-pulse",
  },
  VOTING_CLOSED: {
    label: "Voting Closed",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  CERTIFIED: {
    label: "Certified",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  TIE_RUNOFF_REQUIRED: {
    label: "Runoff Needed",
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500 animate-pulse",
  },
};

interface ElectionStatusBadgeProps {
  status: ElectionStatus;
  className?: string;
}

export function ElectionStatusBadge({
  status,
  className,
}: ElectionStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.DRAFT;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
