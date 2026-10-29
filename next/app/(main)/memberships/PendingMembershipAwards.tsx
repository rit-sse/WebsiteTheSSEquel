"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal, ModalFooter } from "@/components/ui/modal";

interface PendingAward {
  id: string;
  email: string;
  reason: string;
  dateGiven: string;
  term: string;
  year: number;
  emailStatus: "PENDING" | "SENDING" | "SENT" | "FAILED";
  awardedBy: { name: string } | null;
}

const deliveryLabels = {
  PENDING: "Not sent",
  SENDING: "Sending",
  SENT: "Sent",
  FAILED: "Failed or not configured",
};

export function PendingMembershipAwards({ revision }: { revision: number }) {
  const [awards, setAwards] = useState<PendingAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelAward, setCancelAward] = useState<PendingAward | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/memberships/pending");
      if (!response.ok) throw new Error(await response.text());
      setAwards(await response.json());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, revision]);

  async function act(awardId: string, method: "POST" | "DELETE") {
    setBusy(awardId);
    try {
      const response = await fetch("/api/memberships/pending", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awardId }),
      });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      if (result.emailStatus === "FAILED") toast.warning(result.message);
      else toast.success(result.message);
      setCancelAward(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update the pending award."
      );
    } finally {
      setBusy(null);
    }
  }

  const columns: Column<PendingAward>[] = [
    { key: "email", header: "Recipient", isPrimary: true },
    { key: "reason", header: "Reason" },
    {
      key: "dateGiven",
      header: "Earned",
      render: (award) =>
        new Date(award.dateGiven).toLocaleDateString(undefined, {
          timeZone: "UTC",
        }),
    },
    {
      key: "term",
      header: "Term",
      render: (award) =>
        `${award.term === "SPRING" ? "Spring" : "Fall"} ${award.year}`,
    },
    {
      key: "awardedBy",
      header: "Awarded by",
      render: (award) => award.awardedBy?.name ?? "Former officer",
    },
    {
      key: "emailStatus",
      header: "Invitation email",
      render: (award) => deliveryLabels[award.emailStatus],
    },
    {
      key: "actions",
      header: "Actions",
      render: (award) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => void act(award.id, "POST")}
          >
            Resend email
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy !== null}
            onClick={() => setCancelAward(award)}
          >
            Cancel award
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-8 space-y-3">
      <p className="text-sm text-muted-foreground">
        Allow five minutes between invitation emails.
      </p>
      {loadError && (
        <p role="alert" className="text-sm text-destructive">
          Could not load pending awards.{" "}
          <button className="underline" onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}
      <DataTable
        data={awards}
        columns={columns}
        keyField="id"
        title="Pending memberships"
        isLoading={loading}
        emptyMessage="No pending membership awards"
        enablePagination
        defaultPageSize={10}
      />
      <Modal
        open={cancelAward !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setCancelAward(null);
        }}
        title="Cancel pending membership?"
        className="w-[calc(100%-2rem)] sm:w-full"
      >
        <p>
          The {cancelAward?.reason} award for {cancelAward?.email} will no
          longer be claimable.
        </p>
        <ModalFooter>
          <Button
            variant="ghost"
            disabled={busy !== null}
            onClick={() => setCancelAward(null)}
          >
            Keep award
          </Button>
          <Button
            variant="destructive"
            disabled={busy !== null}
            onClick={() => {
              if (cancelAward) void act(cancelAward.id, "DELETE");
            }}
          >
            {busy ? "Cancelling..." : "Cancel award"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
