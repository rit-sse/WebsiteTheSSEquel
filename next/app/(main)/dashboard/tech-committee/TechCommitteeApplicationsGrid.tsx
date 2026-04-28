"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

type ApplicationConfig = {
  isOpen: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700",
  approved: "border-blue-500/30 bg-blue-500/10 text-blue-700",
  rejected: "border-red-500/30 bg-red-500/10 text-red-700",
  assigned: "border-green-500/30 bg-green-500/10 text-green-700",
};

const PAGE_SIZE = 10;
const STATUS_FILTERS = [
  { value: "active", label: "Active Queue" },
  { value: "all", label: "All Applications" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "assigned", label: "Assigned" },
  { value: "rejected", label: "Rejected" },
] as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClasses(status: string) {
  return (
    STATUS_STYLES[status.toLowerCase()] ??
    "border-border bg-muted text-foreground"
  );
}

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

export default function TechCommitteeApplicationsGrid() {
  const [applications, setApplications] = useState<TechCommitteeApplication[]>(
    []
  );
  const [config, setConfig] = useState<ApplicationConfig>({ isOpen: true });
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setIsConfigLoading(true);
      }

      try {
        const [applicationsResponse, configResponse] = await Promise.all([
          fetch("/api/tech-committee-application/apps"),
          fetch("/api/tech-committee-application/config"),
        ]);

        if (!applicationsResponse.ok) {
          const data = await applicationsResponse.json().catch(() => null);
          throw new Error(data?.error || "Failed to load applications");
        }

        if (!configResponse.ok) {
          const data = await configResponse.json().catch(() => null);
          throw new Error(
            data?.error || "Failed to load application availability"
          );
        }

        const [applicationsData, configData] = await Promise.all([
          applicationsResponse.json(),
          configResponse.json(),
        ]);

        setApplications(applicationsData);
        setConfig(configData);
        setError(null);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load applications"
        );
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
          setIsConfigLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const handleQueueRefresh = () => {
      loadDashboardData({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadDashboardData({ silent: true });
      }
    };

    window.addEventListener("focus", handleQueueRefresh);
    window.addEventListener(
      "tech-committee-applications-updated",
      handleQueueRefresh
    );
    window.addEventListener("pageshow", handleQueueRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleQueueRefresh);
      window.removeEventListener(
        "tech-committee-applications-updated",
        handleQueueRefresh
      );
      window.removeEventListener("pageshow", handleQueueRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadDashboardData]);

  const handleToggleApplications = async (checked: boolean) => {
    setIsSavingConfig(true);
    try {
      const response = await fetch("/api/tech-committee-application/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: checked }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || "Failed to update application availability"
        );
      }

      const data = await response.json();
      setConfig(data);
      toast.success(
        data.isOpen ? "Applications opened" : "Applications closed"
      );
      window.dispatchEvent(new Event("tech-committee-applications-updated"));
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update application availability"
      );
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleManualRefresh = async () => {
    await loadDashboardData({ silent: true });
  };

  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") {
      return applications;
    }

    if (statusFilter === "active") {
      return applications.filter(
        (application) =>
          normalizeStatus(application.status) === "pending" ||
          normalizeStatus(application.status) === "approved"
      );
    }

    return applications.filter(
      (application) => normalizeStatus(application.status) === statusFilter
    );
  }, [applications, statusFilter]);

  const counts = useMemo(() => {
    return applications.reduce(
      (acc, application) => {
        const status = normalizeStatus(application.status);
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [applications]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / PAGE_SIZE)
  );

  const paginatedApplications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredApplications.slice(start, start + PAGE_SIZE);
  }, [filteredApplications, page]);

  const startCount =
    filteredApplications.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endCount =
    filteredApplications.length === 0
      ? 0
      : Math.min(page * PAGE_SIZE, filteredApplications.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Card depth={2}>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-4 w-52 rounded bg-muted" />
            </div>
            <div className="h-6 w-12 rounded-full bg-muted" />
          </CardContent>
        </Card>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} depth={2} className="animate-pulse">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[2.2fr_1.2fr_1fr_auto]">
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-5 w-28 rounded bg-muted" />
              <div className="h-5 w-24 rounded bg-muted" />
              <div className="h-9 w-24 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card depth={2}>
        <CardContent className="p-6 text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card depth={2}>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Application Window</p>
              <Badge
                variant="outline"
                className={
                  config.isOpen
                    ? getStatusClasses("assigned")
                    : getStatusClasses("rejected")
                }
              >
                {config.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {config.isOpen
                ? "Students can currently submit Tech Committee applications."
                : "New Tech Committee applications are currently blocked."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="tech-committee-applications-open">
                  Accept Applications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Review access stays available even when submissions are
                  closed.
                </p>
              </div>
              <Switch
                id="tech-committee-applications-open"
                checked={config.isOpen}
                onCheckedChange={handleToggleApplications}
                disabled={isSavingConfig || isConfigLoading}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getStatusClasses("pending")}>
            Pending {counts.pending ?? 0}
          </Badge>
          <Badge variant="outline" className={getStatusClasses("approved")}>
            Approved {counts.approved ?? 0}
          </Badge>
          <Badge variant="outline" className={getStatusClasses("assigned")}>
            Assigned {counts.assigned ?? 0}
          </Badge>
          <Badge variant="outline" className={getStatusClasses("rejected")}>
            Rejected {counts.rejected ?? 0}
          </Badge>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            View
          </p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter applications" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="hidden items-center gap-4 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid md:grid-cols-[2.2fr_1.2fr_1fr_auto]">
        <p>Name</p>
        <p>Applied</p>
        <p>Status</p>
        <p>Review</p>
      </div>

      {applications.length === 0 ? (
        <Card depth={2}>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No Tech Committee applications have been submitted yet.
          </CardContent>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card depth={2}>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No applications match the current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedApplications.map((application) => (
            <Card key={application.id} depth={2}>
              <CardContent className="grid gap-4 p-5 md:grid-cols-[2.2fr_1.2fr_1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground md:hidden">
                    Applicant
                  </p>
                  <p className="truncate font-semibold">
                    {application.user.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {application.user.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground md:hidden">
                    Applied
                  </p>
                  <p className="text-sm">{formatDate(application.createdAt)}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground md:hidden">
                    Status
                  </p>
                  <Badge
                    variant="outline"
                    className={getStatusClasses(application.status)}
                  >
                    {normalizeStatus(application.status)}
                  </Badge>
                </div>

                <div className="flex justify-start md:justify-end">
                  <Button asChild size="sm">
                    <Link href={`/dashboard/tech-committee/${application.id}`}>
                      Review
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Showing {startCount}-{endCount} of {filteredApplications.length}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || filteredApplications.length === 0}
          >
            Previous
          </Button>
          <span className="min-w-16 text-center text-sm">
            Page {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page === totalPages || filteredApplications.length === 0}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
