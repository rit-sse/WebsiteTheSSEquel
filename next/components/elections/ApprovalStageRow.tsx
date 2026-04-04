import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { SerializedApproval, ElectionApprovalStage } from "./types";

interface ApprovalStageRowProps {
  stage: ElectionApprovalStage;
  label: string;
  approvals: SerializedApproval[];
  isCurrentStage: boolean;
  className?: string;
}

const STAGE_DESCRIPTIONS: Record<ElectionApprovalStage, string> = {
  CONFIG: "Approve election configuration before nominations open",
  BALLOT: "Approve the ballot before voting begins",
  CERTIFICATION: "Certify the final election results",
};

export function ApprovalStageRow({
  stage,
  label,
  approvals,
  isCurrentStage,
  className,
}: ApprovalStageRowProps) {
  const stageApprovals = approvals.filter((a) => a.stage === stage);
  const bothApproved = stageApprovals.length >= 2;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
          bothApproved
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            : isCurrentStage
              ? "bg-primary text-primary-foreground"
              : "bg-surface-3 text-muted-foreground"
        )}
      >
        {bothApproved ? <Check className="h-4 w-4" /> : stage[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {bothApproved
            ? `Both approved`
            : `${stageApprovals.length}/2 approved`}
        </p>
      </div>
    </div>
  );
}
