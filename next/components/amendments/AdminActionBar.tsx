"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RoleBadge from "@/components/amendments/RoleBadge";
import ConfirmationDialog from "@/components/amendments/ConfirmationDialog";
import VotingDurationDialog from "@/components/amendments/VotingDurationDialog";
import { AmendmentStatus } from "@prisma/client";

type AdminActionBarProps = {
  status: AmendmentStatus;
  roleName: string;
  onChangeStatus: (s: AmendmentStatus, extraData?: Record<string, unknown>) => void;
  onMerge: () => void;
  actionMessage: string;
  primaryReviewReady?: boolean;
  primaryReviewRejected?: boolean;
};

export default function AdminActionBar({
  status,
  roleName,
  onChangeStatus,
  onMerge,
  actionMessage,
  primaryReviewReady = false,
  primaryReviewRejected = false,
}: AdminActionBarProps) {
  return (
      <Card depth={2} className="p-4 border-l-4 border-l-primary/70">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">
              Admin Actions
            </span>
            <RoleBadge role={roleName} />
          </div>

          <div className="flex flex-wrap gap-2 ml-auto">
            {status === "PRIMARY_REVIEW" && (
              <>
                {primaryReviewReady && (
                  <VotingDurationDialog
                    trigger={
                      <Button size="sm">Open Member Voting</Button>
                    }
                    onConfirm={(hours) => onChangeStatus("VOTING" as AmendmentStatus, { votingDurationHours: hours })}
                  />
                )}
                {primaryReviewRejected && (
                  <ConfirmationDialog
                    trigger={
                      <Button size="sm" variant="destructive">Close as Rejected</Button>
                    }
                    title="Reject Amendment"
                    description="Primary officers have rejected this amendment. This will close it as rejected."
                    confirmLabel="Reject Amendment"
                    variant="destructive"
                    onConfirm={() => onChangeStatus("REJECTED" as AmendmentStatus)}
                  />
                )}
              </>
            )}

            {status === "VOTING" && (
              <>
                <ConfirmationDialog
                  trigger={
                    <Button size="sm">Approve</Button>
                  }
                  title="Approve Amendment"
                  description="This will approve the amendment and close voting. The amendment can then be merged into the governing documents."
                  confirmLabel="Approve"
                  onConfirm={() => onChangeStatus("APPROVED" as AmendmentStatus)}
                />
                <ConfirmationDialog
                  trigger={
                    <Button size="sm" variant="destructive">Reject</Button>
                  }
                  title="Reject Amendment"
                  description="This will reject the amendment and close voting. This action reflects that the amendment did not meet the required approval thresholds."
                  confirmLabel="Reject Amendment"
                  variant="destructive"
                  onConfirm={() => onChangeStatus("REJECTED" as AmendmentStatus)}
                />
              </>
            )}

            {status === "APPROVED" && (
              <ConfirmationDialog
                trigger={
                  <Button size="sm">Merge PR</Button>
                }
                title="Merge Pull Request"
                description="This will merge the amendment's pull request into the governing documents repository. The proposed changes will become part of the official constitution."
                confirmLabel="Merge"
                onConfirm={onMerge}
              />
            )}

            {status !== "WITHDRAWN" && status !== "MERGED" && (
              <ConfirmationDialog
                trigger={
                  <Button size="sm" variant="neutral">
                    Withdraw
                  </Button>
                }
                title="Withdraw Amendment"
                description="This will withdraw the amendment from consideration. The associated pull request will be closed."
                confirmLabel="Withdraw"
                variant="destructive"
                onConfirm={() => onChangeStatus("WITHDRAWN" as AmendmentStatus)}
              />
            )}
          </div>
        </div>

        {actionMessage && (
          <p className="text-sm text-destructive mt-2">{actionMessage}</p>
        )}
      </Card>
  );
}
