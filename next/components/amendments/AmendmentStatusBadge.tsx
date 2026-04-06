import { AmendmentStatus } from "@prisma/client";

const statusConfig: Record<
  AmendmentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  OPEN: {
    label: "Open Forum",
    bg: "bg-sky-50 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  PRIMARY_REVIEW: {
    label: "Primary Review",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500 animate-pulse",
  },
  VOTING: {
    label: "Voting",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500 animate-pulse",
  },
  APPROVED: {
    label: "Approved",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  MERGED: {
    label: "Merged",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    bg: "bg-stone-100 dark:bg-stone-800/50",
    text: "text-stone-500 dark:text-stone-400",
    dot: "bg-stone-400",
  },
};

export default function AmendmentStatusBadge({ status }: { status: AmendmentStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
