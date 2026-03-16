"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type TechCommitteeApplication = {
  id: number;
  yearLevel: string;
  experienceText: string;
  whyJoin: string;
  weeklyCommitment: string;
  preferredDivision: string;
  status: string;
  finalDivision: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700",
  approved: "border-blue-500/30 bg-blue-500/10 text-blue-700",
  rejected: "border-red-500/30 bg-red-500/10 text-red-700",
  assigned: "border-green-500/30 bg-green-500/10 text-green-700",
};

const DIVISIONS = ["Web Division", "Lab Division", "Services Division"] as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClasses(status: string) {
  return STATUS_STYLES[status.toLowerCase()] ?? "border-border bg-muted text-foreground";
}

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function notifyApplicationsUpdated() {
  window.dispatchEvent(new Event("tech-committee-applications-updated"));
}

export default function TechCommitteeApplicationReviewPage({
  applicationId,
  canTakeActions,
  managedDivision,
}: {
  applicationId: string;
  canTakeActions: boolean;
  managedDivision: string | null;
}) {
  const [application, setApplication] =
    useState<TechCommitteeApplication | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadApplication = async () => {
      try {
        const response = await fetch(
          `/api/tech-committee-application/apps/${applicationId}`
        );
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Failed to load application");
        }

        const data = await response.json();
        if (!isMounted) return;
        setApplication(data);
        setSelectedDivision(data.finalDivision ?? data.preferredDivision ?? "");
      } catch (fetchError) {
        if (!isMounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load application"
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadApplication();

    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  const handleApprove = async () => {
    if (!application) return;

    setIsApproving(true);
    try {
      const response = await fetch("/api/tech-committee-application/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          action: "approve",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to approve application");
      }

      const updatedApplication = await response.json();
      setApplication(updatedApplication);
      notifyApplicationsUpdated();
      toast.success("Application approved");
    } catch (approveError) {
      toast.error(
        approveError instanceof Error
          ? approveError.message
          : "Failed to approve application"
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;

    setIsRejecting(true);
    try {
      const response = await fetch("/api/tech-committee-application/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          action: "reject",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to reject application");
      }

      const updatedApplication = await response.json();
      setApplication(updatedApplication);
      notifyApplicationsUpdated();
      toast.success("Application rejected");
    } catch (rejectError) {
      toast.error(
        rejectError instanceof Error
          ? rejectError.message
          : "Failed to reject application"
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAssign = async () => {
    if (!application || !selectedDivision) return;

    setIsAssigning(true);
    try {
      const response = await fetch("/api/tech-committee-application/assign", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          finalDivision: selectedDivision,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to assign application");
      }

      const updatedApplication = await response.json();
      setApplication(updatedApplication);
      setSelectedDivision(updatedApplication.finalDivision ?? "");
      notifyApplicationsUpdated();
      toast.success("Application assigned");
    } catch (assignError) {
      toast.error(
        assignError instanceof Error
          ? assignError.message
          : "Failed to assign application"
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/tech-committee">
            <ArrowLeft className="h-4 w-4" />
            Back to apps
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleApprove}
            disabled={
              isLoading ||
              !canTakeActions ||
              normalizeStatus(application?.status ?? "") !== "pending" ||
              isApproving ||
              isRejecting ||
              isAssigning
            }
          >
            {isApproving ? "Approving..." : "Approve"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={
              isLoading ||
              !canTakeActions ||
              !application ||
              normalizeStatus(application.status) !== "pending" ||
              isRejecting ||
              isApproving ||
              isAssigning
            }
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card depth={1}>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading application...
          </CardContent>
        </Card>
      ) : error ? (
        <Card depth={1}>
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : application ? (
        <>
          <Card depth={1}>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">
                    {application.user.name}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {application.user.email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusClasses(application.status)}
                >
                  {normalizeStatus(application.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Applied
                </p>
                <p className="mt-1 text-sm">{formatDate(application.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Year Level
                </p>
                <p className="mt-1 text-sm">{application.yearLevel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Preferred Division
                </p>
                <p className="mt-1 text-sm">{application.preferredDivision}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Final Division
                </p>
                <p className="mt-1 text-sm">
                  {application.finalDivision ?? "Not assigned"}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Weekly Commitment
                </p>
                <p className="mt-1 text-sm">{application.weeklyCommitment}</p>
              </div>
            </CardContent>
          </Card>

          <Card depth={1}>
            <CardHeader>
              <CardTitle className="text-lg">Division Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Final Division
                </p>
                <Select
                  value={selectedDivision}
                  onValueChange={setSelectedDivision}
                  disabled={
                    normalizeStatus(application.status) !== "approved" ||
                    isAssigning ||
                    !canTakeActions
                  }
                >
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Select a final division" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIVISIONS.filter((division) =>
                      managedDivision ? division === managedDivision : true
                    ).map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleAssign}
                  disabled={
                    isLoading ||
                    !canTakeActions ||
                    !application ||
                    normalizeStatus(application.status) !== "approved" ||
                    !selectedDivision ||
                    isAssigning ||
                    isApproving ||
                    isRejecting
                  }
                >
                  {isAssigning ? "Assigning..." : "Assign to Division"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card depth={1}>
            <CardHeader>
              <CardTitle className="text-lg">Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {application.experienceText}
              </p>
            </CardContent>
          </Card>

          <Card depth={1}>
            <CardHeader>
              <CardTitle className="text-lg">Why They Want to Join</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{application.whyJoin}</p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
