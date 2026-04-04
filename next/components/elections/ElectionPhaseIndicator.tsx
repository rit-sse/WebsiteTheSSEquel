import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { ELECTION_PHASE_ORDER, ELECTION_PHASE_LABELS } from "./types";
import type { ElectionStatus } from "./types";

interface ElectionPhaseIndicatorProps {
  currentPhase: ElectionStatus;
  className?: string;
  compact?: boolean;
}

const TOOLTIP_TEXT: Record<string, string> = {
  DRAFT: "Election is being configured",
  NOMINATIONS_OPEN: "Members can nominate candidates",
  NOMINATIONS_CLOSED: "Nominations are closed, awaiting ballot approval",
  VOTING_OPEN: "Members can cast ranked-choice ballots",
  VOTING_CLOSED: "Votes are tallied, awaiting certification",
  CERTIFIED: "Results are certified and official",
};

export function ElectionPhaseIndicator({
  currentPhase,
  className,
  compact = false,
}: ElectionPhaseIndicatorProps) {
  // Terminal states get their own rendering
  if (currentPhase === "CANCELLED" || currentPhase === "TIE_RUNOFF_REQUIRED") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            currentPhase === "CANCELLED"
              ? "bg-rose-500"
              : "bg-orange-500 animate-pulse"
          )}
        />
        <span className="text-xs text-muted-foreground">
          {ELECTION_PHASE_LABELS[currentPhase]}
        </span>
      </div>
    );
  }

  const currentIndex = ELECTION_PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className={cn("flex items-center", className)}>
      {ELECTION_PHASE_ORDER.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={phase} className="flex items-center">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-3 transition-colors duration-300",
                  compact && "w-2",
                  isCompleted || isCurrent
                    ? "bg-primary/60"
                    : "bg-border/40"
                )}
              />
            )}
            <Tooltip
              content={
                <div>
                  <p className="font-medium">{ELECTION_PHASE_LABELS[phase]}</p>
                  <p className="text-muted-foreground">{TOOLTIP_TEXT[phase]}</p>
                </div>
              }
              size="sm"
            >
              <div
                className={cn(
                  "flex items-center gap-1 transition-all duration-300",
                  isCurrent && "scale-110"
                )}
              >
                <div
                  className={cn(
                    "rounded-full transition-all duration-300",
                    isCurrent
                      ? "h-2.5 w-2.5 bg-primary ring-2 ring-primary/20"
                      : isCompleted
                        ? "h-2 w-2 bg-primary/60"
                        : "h-2 w-2 bg-border/40",
                    isCurrent && "animate-pulse"
                  )}
                />
                {!compact && (isCurrent || isCompleted) && (
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap hidden sm:inline",
                      isCurrent
                        ? "text-foreground"
                        : isCompleted
                          ? "text-muted-foreground"
                          : "text-muted-foreground/40"
                    )}
                  >
                    {ELECTION_PHASE_LABELS[phase]}
                  </span>
                )}
                {compact && isCurrent && (
                  <span className="text-[10px] font-medium text-foreground whitespace-nowrap">
                    {ELECTION_PHASE_LABELS[phase]}
                  </span>
                )}
              </div>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
