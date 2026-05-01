"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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

interface Cycle {
  id: number;
  name: string;
  status: "OPEN" | "CLOSED" | "ARCHIVED";
}

interface Position {
  id: number;
  title: string;
}

interface Application {
  id: number;
  status: string;
  yearLevel: string;
  major: string;
  experienceText: string;
  whyInterested: string;
  weeklyCommitment: string;
  comments: string | null;
  applicant: {
    id: number;
    name: string;
    email: string;
  };
  preferences: {
    rank: number;
    officerPosition: Position;
  }[];
  nominations: {
    id: number;
    reason: string;
    nominator: { name: string; email: string };
  }[];
  selectedPosition: Position | null;
}

interface AdminPayload {
  cycles: Cycle[];
  selectedCycle: Cycle | null;
  positions: Position[];
  applications: Application[];
}

export default function CommitteeHeadNominationsClient() {
  const [payload, setPayload] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [cycleId, setCycleId] = useState<string>("latest");
  const [selecting, setSelecting] = useState<number | null>(null);
  const [selectedPositions, setSelectedPositions] = useState<
    Record<number, string>
  >({});

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cycleId !== "latest") params.set("cycleId", cycleId);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (positionFilter !== "all") params.set("positionId", positionFilter);
      const response = await fetch(
        `/api/committee-head-nominations/admin?${params.toString()}`
      );
      if (!response.ok) {
        toast.error(await response.text());
        return;
      }
      const data = await response.json();
      setPayload(data);
    } finally {
      setLoading(false);
    }
  }, [cycleId, positionFilter, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateCycleStatus = async (status: "OPEN" | "CLOSED") => {
    if (!payload?.selectedCycle) return;
    const response = await fetch(
      "/api/committee-head-nominations/admin/config",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: payload.selectedCycle.id,
          status,
        }),
      }
    );
    if (response.ok) {
      toast.success(status === "OPEN" ? "Cycle reopened" : "Cycle closed");
      fetchApplications();
    } else {
      toast.error(await response.text());
    }
  };

  const selectApplication = async (application: Application) => {
    const positionId = Number(selectedPositions[application.id]);
    if (!Number.isInteger(positionId)) {
      toast.error("Choose a position first.");
      return;
    }
    setSelecting(application.id);
    try {
      const response = await fetch(
        `/api/committee-head-nominations/admin/${application.id}/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ positionId }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Selection failed.");
        return;
      }
      toast.success(
        data.emailSent
          ? "Officer invitation sent."
          : "Selection saved; email was not sent."
      );
      fetchApplications();
    } finally {
      setSelecting(null);
    }
  };

  const markNotSelected = async (application: Application) => {
    const response = await fetch(
      `/api/committee-head-nominations/admin/${application.id}/not-selected`,
      { method: "POST" }
    );
    if (response.ok) {
      toast.success("Application marked not selected.");
      fetchApplications();
    } else {
      toast.error(await response.text());
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Committee Head Nominations
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review applications and send officer invitations to selected
            Committee Heads.
          </p>
        </div>
        {payload?.selectedCycle && (
          <div className="flex flex-wrap gap-2">
            <Badge>{payload.selectedCycle.status}</Badge>
            {payload.selectedCycle.status === "OPEN" ? (
              <Button
                variant="outline"
                onClick={() => updateCycleStatus("CLOSED")}
              >
                Close cycle
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => updateCycleStatus("OPEN")}
              >
                Reopen cycle
              </Button>
            )}
          </div>
        )}
      </header>

      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Select value={cycleId} onValueChange={setCycleId}>
            <SelectTrigger>
              <SelectValue placeholder="Cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest cycle</SelectItem>
              {payload?.cycles.map((cycle) => (
                <SelectItem key={cycle.id} value={String(cycle.id)}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Active statuses</SelectItem>
              <SelectItem value="PENDING_ACCEPTANCE">Pending acceptance</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="SELECTED">Selected</SelectItem>
              <SelectItem value="NOT_SELECTED">Not selected</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All positions</SelectItem>
              {payload?.positions.map((position) => (
                <SelectItem key={position.id} value={String(position.id)}>
                  {position.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : !payload?.selectedCycle ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            No Committee Head nomination cycles exist yet.
          </CardContent>
        </Card>
      ) : payload.applications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            No applications match the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payload.applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {application.applicant.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {application.applicant.email} · {application.yearLevel} ·{" "}
                      {application.major}
                    </p>
                  </div>
                  <Badge>{application.status.replaceAll("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <InfoBlock
                    title="Preferences"
                    body={application.preferences
                      .map(
                        (pref) =>
                          `${pref.rank}. ${pref.officerPosition.title}`
                      )
                      .join("\n")}
                  />
                  <InfoBlock
                    title="Experience"
                    body={application.experienceText}
                  />
                  <InfoBlock
                    title="Commitment"
                    body={application.weeklyCommitment}
                  />
                </div>
                <InfoBlock title="Why interested" body={application.whyInterested} />
                {application.nominations.length > 0 && (
                  <div className="rounded-md border p-3">
                    <h3 className="mb-2 text-sm font-semibold">
                      Third-party nominations
                    </h3>
                    <div className="space-y-2 text-sm">
                      {application.nominations.map((nomination) => (
                        <div key={nomination.id}>
                          <p className="font-medium">
                            {nomination.nominator.name} (
                            {nomination.nominator.email})
                          </p>
                          <p className="text-muted-foreground">
                            {nomination.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {application.status === "SELECTED" ? (
                  <p className="text-sm font-medium">
                    Selected for {application.selectedPosition?.title}
                  </p>
                ) : application.status === "SUBMITTED" ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={selectedPositions[application.id] ?? ""}
                      onValueChange={(value) =>
                        setSelectedPositions((prev) => ({
                          ...prev,
                          [application.id]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="sm:w-[280px]">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {payload.positions.map((position) => (
                          <SelectItem key={position.id} value={String(position.id)}>
                            {position.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => selectApplication(application)}
                      disabled={selecting === application.id}
                    >
                      Send officer invite
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => markNotSelected(application)}
                    >
                      Mark not selected
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border p-3">
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
        {body || "None provided"}
      </p>
    </div>
  );
}
