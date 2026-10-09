"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { parseApiError } from "@/lib/apiClient";

interface UserExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserExportModal({
  open,
  onOpenChange,
}: UserExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    let objectUrl: string | undefined;
    let link: HTMLAnchorElement | undefined;

    try {
      const response = await fetch("/api/user/export", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          await parseApiError(response, "Unable to export users.")
        );
      }
      if (!response.headers.get("Content-Type")?.startsWith("text/csv")) {
        throw new Error("Unable to download the export. Please sign in again.");
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      const filename = response.headers
        .get("Content-Disposition")
        ?.match(/filename="([^"]+)"/)?.[1];
      link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename ?? "sse-users.csv";
      document.body.appendChild(link);
      link.click();
      // Let the browser consume the object URL before releasing it.
      const downloadUrl = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      objectUrl = undefined;
      toast.success("User export download started");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export users.");
    } finally {
      link?.remove();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setIsExporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (isExporting) return;
        setError(null);
        onOpenChange(nextOpen);
      }}
      title="Export users"
      description="Download a CSV of every user."
    >
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          Includes user ID, name, email, alumni status, and{" "}
          <strong>Date created</strong>.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <ModalFooter>
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={isExporting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          aria-busy={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Preparing export…" : "Download CSV"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
