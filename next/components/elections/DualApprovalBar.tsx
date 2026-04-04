"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Check, Loader2 } from "lucide-react";
import type { SerializedApproval, ElectionApprovalStage } from "./types";

interface DualApprovalBarProps {
  stage: ElectionApprovalStage;
  stageLabel: string;
  approvals: SerializedApproval[];
  currentUserId: number | null;
  currentUserRole: "PRESIDENT" | "SE_ADMIN" | null;
  onApprove: (stage: ElectionApprovalStage) => Promise<void>;
  onRemoveApproval: (stage: ElectionApprovalStage) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function DualApprovalBar({
  stage,
  stageLabel,
  approvals,
  currentUserId,
  currentUserRole,
  onApprove,
  onRemoveApproval,
  loading = false,
  className,
}: DualApprovalBarProps) {
  const stageApprovals = approvals.filter((a) => a.stage === stage);
  const currentUserApproved = stageApprovals.some(
    (a) => a.userId === currentUserId
  );

  // Figure out who is President and who is SE Admin among approvers
  // We can't know from approvals alone, but we show all approvers
  const approverNames = stageApprovals.map((a) => a.user.name);
  const bothApproved = stageApprovals.length >= 2;

  return (
    <Card depth={3} className={cn("p-4 flex flex-wrap items-center gap-4", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {stageLabel}
      </span>

      <div className="flex gap-3">
        <Tooltip
          content={
            <div>
              <p className="font-medium">President Approval</p>
              <p>
                {approverNames.length > 0
                  ? `Approved by: ${approverNames.join(", ")}`
                  : "Awaiting approval"}
              </p>
            </div>
          }
          size="sm"
        >
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
              stageApprovals.length >= 1
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "bg-surface-3 text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                stageApprovals.length >= 1
                  ? "bg-emerald-500"
                  : "bg-muted-foreground/30"
              )}
            />
            <span className="text-xs font-medium">President</span>
            {stageApprovals.length >= 1 && (
              <Check className="h-3.5 w-3.5" />
            )}
          </div>
        </Tooltip>

        <Tooltip
          content={
            <div>
              <p className="font-medium">SE Admin Approval</p>
              <p>
                {bothApproved
                  ? "Both approvals received"
                  : "Awaiting SE Admin approval"}
              </p>
            </div>
          }
          size="sm"
        >
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
              bothApproved
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "bg-surface-3 text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                bothApproved
                  ? "bg-emerald-500"
                  : "bg-muted-foreground/30"
              )}
            />
            <span className="text-xs font-medium">SE Admin</span>
            {bothApproved && <Check className="h-3.5 w-3.5" />}
          </div>
        </Tooltip>
      </div>

      {currentUserRole && !currentUserApproved && (
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => onApprove(stage)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>Approve {stageLabel}</>
          )}
        </Button>
      )}

      {currentUserRole && currentUserApproved && (
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-muted-foreground"
          onClick={() => onRemoveApproval(stage)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Remove My Approval"
          )}
        </Button>
      )}
    </Card>
  );
}
