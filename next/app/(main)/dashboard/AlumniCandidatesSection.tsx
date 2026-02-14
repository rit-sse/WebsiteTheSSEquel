"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

type CandidateStatus = "pending" | "approved" | "rejected";

interface AlumniCandidate {
  id: number;
  userId: number;
  name: string;
  email: string;
  linkedIn?: string | null;
  gitHub?: string | null;
  description?: string | null;
  imageKey?: string | null;
  graduationTerm?: "SPRING" | "SUMMER" | "FALL" | null;
  graduationYear?: number | null;
  major?: string | null;
  coopSummary?: string | null;
  status: CandidateStatus;
  createdAt: string;
}

export default function AlumniCandidatesSection() {
  const [rows, setRows] = useState<AlumniCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/alumni-candidates?status=pending");
      if (!response.ok) {
        throw new Error("Failed to load candidates");
      }
      const data = await response.json();
      setRows(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load alumni candidates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const review = async (id: number, status: CandidateStatus) => {
    setProcessingId(id);
    setError("");
    try {
      const response = await fetch("/api/alumni-candidates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Review failed");
      }
      await fetchRows();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setProcessingId(null);
    }
  };

  const columns: Column<AlumniCandidate>[] = [
    {
      key: "name",
      header: "Name",
      isPrimary: true,
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{row.name}</div>
          <div className="text-xs text-muted-foreground truncate">{row.email}</div>
        </div>
      ),
    },
    {
      key: "major",
      header: "Major",
      render: (row) => <span className="text-xs text-muted-foreground">{row.major || "-"}</span>,
    },
    {
      key: "graduation",
      header: "Graduation",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.graduationTerm && row.graduationYear
            ? `${row.graduationTerm} ${row.graduationYear}`
            : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      isAction: true,
      render: (row) => {
        const disabled = processingId === row.id;
        return (
          <div className="flex gap-1">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => review(row.id, "rejected")}
              disabled={disabled}
              title="Reject"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              size="xs"
              variant="accent"
              onClick={() => review(row.id, "approved")}
              disabled={disabled}
              title="Approve"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {error && (
        <div className="mb-3 p-2 bg-destructive/10 text-destructive rounded-lg text-xs">
          {error}
        </div>
      )}
      <DataTable
        data={rows}
        columns={columns}
        keyField="id"
        title="Alumni Candidate Review Queue"
        searchPlaceholder="Search candidates..."
        searchFields={["name", "email", "major"]}
        isLoading={isLoading}
        emptyMessage="No pending alumni candidates"
      />
    </div>
  );
}
