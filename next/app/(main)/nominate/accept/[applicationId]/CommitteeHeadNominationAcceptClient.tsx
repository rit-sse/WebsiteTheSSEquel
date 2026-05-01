"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const YEAR_LEVELS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th (Undergrad)",
  "MS Student",
  "Other",
];

interface ApplicationDetail {
  id: number;
  status: string;
  major: string;
  yearLevel: string;
  experienceText: string;
  whyInterested: string;
  weeklyCommitment: string;
  comments: string | null;
  cycle: { id: number; name: string; status: string };
  preferences: { officerPosition: { id: number; title: string } }[];
  nominations: {
    id: number;
    reason: string;
    nominator: { name: string; email: string };
  }[];
}

interface PositionOption {
  id: number;
  title: string;
  email: string;
}

export default function CommitteeHeadNominationAcceptClient({
  applicationId,
}: {
  applicationId: string;
}) {
  const { data: session, status } = useSession();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [form, setForm] = useState({
    yearLevel: "",
    major: "",
    experienceText: "",
    whyInterested: "",
    weeklyCommitment: "",
    comments: "",
  });

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [applicationRes, statusRes] = await Promise.all([
          fetch(`/api/committee-head-nominations/${applicationId}`),
          fetch("/api/committee-head-nominations?status=true"),
        ]);
        if (applicationRes.ok) {
          const detail = await applicationRes.json();
          setApplication(detail);
          setSelectedPositions(
            detail.preferences.map(
              (pref: { officerPosition: { id: number } }) =>
                pref.officerPosition.id
            )
          );
          setForm({
            yearLevel: detail.yearLevel || "",
            major: detail.major || "",
            experienceText: detail.experienceText || "",
            whyInterested: detail.whyInterested || "",
            weeklyCommitment: detail.weeklyCommitment || "",
            comments: detail.comments || "",
          });
        } else {
          toast.error(await applicationRes.text());
        }
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setPositions(statusData.positions ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicationId, status]);

  const selectedPositionLabels = useMemo(
    () =>
      selectedPositions
        .map((id) => positions.find((position) => position.id === id))
        .filter((position): position is PositionOption => !!position),
    [positions, selectedPositions]
  );

  const togglePosition = (positionId: number) => {
    setSelectedPositions((prev) =>
      prev.includes(positionId)
        ? prev.filter((id) => id !== positionId)
        : [...prev, positionId]
    );
  };

  const submit = async (action: "accept" | "decline") => {
    if (action === "accept") {
      if (selectedPositions.length === 0) {
        toast.error("Select at least one position.");
        return;
      }
      for (const [key, value] of Object.entries(form)) {
        if (key !== "comments" && !value.trim()) {
          toast.error("Complete all required fields.");
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/committee-head-nominations/${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            preferences: selectedPositions.map((positionId, index) => ({
              positionId,
              rank: index + 1,
            })),
            ...form,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Unable to update nomination.");
        return;
      }
      toast.success(action === "accept" ? "Nomination accepted." : "Nomination declined.");
      window.location.href = "/nominate";
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="p-6 text-muted-foreground">Loading...</CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to respond</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => signIn("google")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Nomination not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/nominate">Back to nominations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Accept Committee Head nomination</CardTitle>
          <p className="text-sm text-muted-foreground">{application.cycle.name}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {application.nominations.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold">Nominated by</h2>
              <div className="space-y-2">
                {application.nominations.map((nomination) => (
                  <div key={nomination.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">
                      {nomination.nominator.name} ({nomination.nominator.email})
                    </p>
                    <p className="mt-1 text-muted-foreground">{nomination.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <Label>Ranked position preferences</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {positions.map((position) => (
                <label
                  key={position.id}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedPositions.includes(position.id)}
                    onChange={() => togglePosition(position.id)}
                  />
                  <span>{position.title}</span>
                </label>
              ))}
            </div>
            {selectedPositionLabels.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Ranking: {selectedPositionLabels.map((p) => p.title).join(", ")}
              </p>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="yearLevel">Year level</Label>
              <select
                id="yearLevel"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.yearLevel}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, yearLevel: event.target.value }))
                }
              >
                <option value="">Select year</option>
                {YEAR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                value={form.major}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, major: event.target.value }))
                }
              />
            </div>
            <TextAreaField
              id="experience"
              label="Relevant experience"
              value={form.experienceText}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, experienceText: value }))
              }
            />
            <TextAreaField
              id="why"
              label="Why are you interested?"
              value={form.whyInterested}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, whyInterested: value }))
              }
            />
            <TextAreaField
              id="commitment"
              label="Weekly commitment / availability"
              value={form.weeklyCommitment}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, weeklyCommitment: value }))
              }
            />
            <TextAreaField
              id="comments"
              label="Optional notes"
              value={form.comments}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, comments: value }))
              }
            />
          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => submit("accept")} disabled={submitting}>
              Accept and submit application
            </Button>
            <Button
              variant="outline"
              onClick={() => submit("decline")}
              disabled={submitting}
            >
              Decline nomination
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
      />
    </div>
  );
}
