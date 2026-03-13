"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClasses(status: string) {
  return STATUS_STYLES[status] ?? "border-border bg-muted text-foreground";
}

function truncate(text: string, limit = 160) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}...`;
}

export default function TechCommitteeApplicationsGrid() {
  const [applications, setApplications] = useState<TechCommitteeApplication[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      try {
        const response = await fetch("/api/tech-committee-application/apps");
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Failed to load applications");
        }

        const data = await response.json();
        if (!isMounted) return;
        setApplications(data);
      } catch (fetchError) {
        if (!isMounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load applications"
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} depth={2} className="animate-pulse">
            <CardHeader className="space-y-3">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card depth={2}>
        <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card depth={2}>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No Tech Committee applications have been submitted yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {applications.map((application) => (
        <Card key={application.id} depth={2} className="h-full">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-lg">
                  {application.user.name}
                </CardTitle>
                <CardDescription className="truncate">
                  {application.user.email}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={getStatusClasses(application.status)}
              >
                {application.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Year
                </p>
                <p>{application.yearLevel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Submitted
                </p>
                <p>{formatDate(application.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Preferred
                </p>
                <p>{application.preferredDivision}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Final
                </p>
                <p>{application.finalDivision ?? "Not assigned"}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Weekly Commitment
                </p>
                <p>{application.weeklyCommitment}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Experience
                </p>
                <p>{truncate(application.experienceText)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Why Join
                </p>
                <p>{truncate(application.whyJoin)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
