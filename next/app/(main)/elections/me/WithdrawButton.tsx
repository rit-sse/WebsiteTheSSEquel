"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalFooter,
} from "@/components/ui/modal";

interface WithdrawButtonProps {
  /** Distinguishes the two endpoints + body shapes:
   *  - "nomination": POST /respond/[nominationId] with { status: "WITHDRAWN" }
   *  - "running-mate": PATCH /running-mate/respond with { action: "WITHDRAW" }
   */
  kind: "nomination" | "running-mate";
  electionId: number;
  /** For "nomination": the nomination's own id.
   *  For "running-mate": the PRESIDENT's nomination id (the running-mate
   *  invitation is keyed by that). */
  nominationId: number;
  /** Title shown in the confirm dialog ("withdraw from Treasurer race"
   *  vs "withdraw from running with Madison"). */
  contextLabel: string;
}

export default function WithdrawButton({
  kind,
  electionId,
  nominationId,
  contextLabel,
}: WithdrawButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const handleWithdraw = async () => {
    setSubmitting(true);
    try {
      const url =
        kind === "nomination"
          ? `/api/elections/${electionId}/nominations/${nominationId}/respond`
          : `/api/elections/${electionId}/nominations/${nominationId}/running-mate/respond`;
      const init: RequestInit = {
        method: kind === "nomination" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:
          kind === "nomination"
            ? JSON.stringify({ status: "WITHDRAWN" })
            : JSON.stringify({ action: "WITHDRAW" }),
      };
      const response = await fetch(url, init);
      if (!response.ok) {
        toast.error((await response.text()) || "Failed to withdraw");
        return;
      }
      toast.success("Withdrawn from the ballot.");
      setConfirmOpen(false);
      // Server component — re-render the list with the new status.
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Failed to withdraw");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <UserMinus className="mr-2 h-4 w-4" />
        Withdraw
      </Button>
      <Modal
        open={confirmOpen}
        onOpenChange={(o) => !o && !submitting && setConfirmOpen(false)}
        title="Withdraw from the ballot?"
        description={`You're about to withdraw from ${contextLabel}. Voters who ranked you will have their next preference counted instead — same as if you'd been eliminated. You can't undo this from the website; you'd have to be re-nominated.`}
        className="max-w-md"
      >
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleWithdraw}
            disabled={submitting}
            className="gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <UserMinus className="h-4 w-4" />
            Yes, withdraw
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
