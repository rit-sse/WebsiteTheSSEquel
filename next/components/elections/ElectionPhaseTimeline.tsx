"use client";

import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Check,
  Circle,
  FileText,
  Users,
  UserCheck,
  Vote,
  Lock,
  Award,
} from "lucide-react";
import { ELECTION_PHASE_ORDER, ELECTION_PHASE_LABELS } from "./types";
import type { ElectionStatus } from "./types";

interface ElectionPhaseTimelineProps {
  status: ElectionStatus;
  nominationsOpenAt: string;
  nominationsCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  certifiedAt?: string | null;
  className?: string;
}

const PHASE_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <FileText className="h-3.5 w-3.5" />,
  NOMINATIONS_OPEN: <Users className="h-3.5 w-3.5" />,
  NOMINATIONS_CLOSED: <UserCheck className="h-3.5 w-3.5" />,
  VOTING_OPEN: <Vote className="h-3.5 w-3.5" />,
  VOTING_CLOSED: <Lock className="h-3.5 w-3.5" />,
  CERTIFIED: <Award className="h-3.5 w-3.5" />,
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ElectionPhaseTimeline({
  status,
  nominationsOpenAt,
  nominationsCloseAt,
  votingOpenAt,
  votingCloseAt,
  certifiedAt,
  className,
}: ElectionPhaseTimelineProps) {
  if (status === "CANCELLED" || status === "TIE_RUNOFF_REQUIRED") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-3",
          className
        )}
      >
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            status === "CANCELLED"
              ? "bg-rose-500"
              : "bg-orange-500 animate-pulse"
          )}
        />
        <span className="text-sm font-medium">
          {ELECTION_PHASE_LABELS[status]}
        </span>
      </div>
    );
  }

  const currentIndex = ELECTION_PHASE_ORDER.indexOf(status);

  const phaseDates: Record<string, string | null> = {
    DRAFT: null,
    NOMINATIONS_OPEN: nominationsOpenAt,
    NOMINATIONS_CLOSED: nominationsCloseAt,
    VOTING_OPEN: votingOpenAt,
    VOTING_CLOSED: votingCloseAt,
    CERTIFIED: certifiedAt ?? null,
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop horizontal timeline */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* Background connector line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-border/30" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-primary/60 transition-all duration-700"
          style={{
            width: `${Math.max(0, (currentIndex / (ELECTION_PHASE_ORDER.length - 1)) * 100)}%`,
            maxWidth: "calc(100% - 2rem)",
          }}
        />

        {ELECTION_PHASE_ORDER.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const dateStr = phaseDates[phase];

          return (
            <Tooltip
              key={phase}
              content={
                <div>
                  <p className="font-medium">{ELECTION_PHASE_LABELS[phase]}</p>
                  {dateStr && <p>{formatDate(dateStr)}</p>}
                  {isCurrent && <p className="text-primary">Current phase</p>}
                </div>
              }
              size="sm"
            >
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted &&
                      "bg-primary/15 text-primary",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
                    isFuture &&
                      "bg-surface-3 text-muted-foreground/40"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    PHASE_ICONS[phase] ?? <Circle className="h-3.5 w-3.5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center whitespace-nowrap",
                    isCurrent
                      ? "text-foreground"
                      : isCompleted
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40"
                  )}
                >
                  {ELECTION_PHASE_LABELS[phase]}
                </span>
                {dateStr && (
                  <span className="text-[9px] text-muted-foreground/60">
                    {formatDate(dateStr)}
                  </span>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="md:hidden space-y-2">
        {ELECTION_PHASE_ORDER.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const dateStr = phaseDates[phase];

          if (isFuture && index > currentIndex + 1) return null;

          return (
            <div key={phase} className="flex items-center gap-3">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                  isCompleted && "bg-primary/15 text-primary",
                  isCurrent &&
                    "bg-primary text-primary-foreground",
                  isFuture && "bg-surface-3 text-muted-foreground/40"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  PHASE_ICONS[phase] ?? <Circle className="h-3 w-3" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCurrent
                      ? "text-foreground"
                      : isCompleted
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40"
                  )}
                >
                  {ELECTION_PHASE_LABELS[phase]}
                </span>
                {dateStr && (
                  <span className="text-[10px] text-muted-foreground/60 ml-2">
                    {formatDate(dateStr)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
