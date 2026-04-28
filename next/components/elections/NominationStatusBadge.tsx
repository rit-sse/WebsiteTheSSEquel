import { cn } from "@/lib/utils";
import type { ElectionNominationStatus, ElectionEligibilityStatus } from "./types";

const nominationConfig: Record<
  ElectionNominationStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING_RESPONSE: {
    label: "Pending",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500 animate-pulse",
  },
  ACCEPTED: {
    label: "Accepted",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  DECLINED: {
    label: "Declined",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  EXPIRED: {
    label: "Expired",
    bg: "bg-stone-100 dark:bg-stone-800/50",
    text: "text-stone-500 dark:text-stone-400",
    dot: "bg-stone-400",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    bg: "bg-stone-100 dark:bg-stone-800/50",
    text: "text-stone-600 dark:text-stone-300",
    dot: "bg-stone-500",
  },
};

const eligibilityConfig: Record<
  ElectionEligibilityStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: "Review Pending",
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400 animate-pulse",
  },
  APPROVED: {
    label: "Eligible",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Ineligible",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

interface NominationStatusBadgeProps {
  status: ElectionNominationStatus;
  className?: string;
}

export function NominationStatusBadge({
  status,
  className,
}: NominationStatusBadgeProps) {
  const config = nominationConfig[status] ?? nominationConfig.PENDING_RESPONSE;

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

interface EligibilityBadgeProps {
  status: ElectionEligibilityStatus;
  className?: string;
}

export function EligibilityBadge({
  status,
  className,
}: EligibilityBadgeProps) {
  const config = eligibilityConfig[status] ?? eligibilityConfig.PENDING;

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
