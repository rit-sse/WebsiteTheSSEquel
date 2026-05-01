"use client";

import { useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { CheckCircle2, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import UserSearchInviteModal from "@/components/common/UserSearchInviteModal";
import type {
  CommitteeHeadNominateData,
  CommitteeHeadPositionOption,
} from "./types";

const YEAR_LEVELS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th (Undergrad)",
  "MS Student",
  "Other",
];

type Mode = "self" | "nominate";

interface FormState {
  yearLevel: string;
  major: string;
  experienceText: string;
  whyInterested: string;
  weeklyCommitment: string;
  comments: string;
}

const emptyForm: FormState = {
  yearLevel: "",
  major: "",
  experienceText: "",
  whyInterested: "",
  weeklyCommitment: "",
  comments: "",
};

export default function NominateClient({
  data,
}: {
  data: CommitteeHeadNominateData;
}) {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<Mode>("self");
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    major: data.viewer?.major ?? "",
  });
  const [nomineeUserId, setNomineeUserId] = useState<number | null>(null);
  const [nomineeName, setNomineeName] = useState<string>("");
  const [nominationReason, setNominationReason] = useState("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const signedIn = !!session?.user;
  const sortedSelectedPositions = useMemo(
    () =>
      selectedPositions
        .map((id) => data.positions.find((position) => position.id === id))
        .filter((position): position is CommitteeHeadPositionOption => !!position),
    [data.positions, selectedPositions]
  );

  const togglePosition = (positionId: number) => {
    setSelectedPositions((prev) =>
      prev.includes(positionId)
        ? prev.filter((id) => id !== positionId)
        : [...prev, positionId]
    );
  };

  const movePosition = (positionId: number, direction: -1 | 1) => {
    setSelectedPositions((prev) => {
      const index = prev.indexOf(positionId);
      const nextIndex = index + direction;
      if (index === -1 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[nextIndex]] = [copy[nextIndex]!, copy[index]!];
      return copy;
    });
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!data.cycle) return "Committee Head nominations are closed.";
    if (selectedPositions.length === 0) return "Select at least one position.";
    if (mode === "nominate") {
      if (!nomineeUserId) return "Choose a nominee.";
      if (!nominationReason.trim()) return "Add a nomination reason.";
      return null;
    }
    if (!form.yearLevel) return "Year level is required.";
    if (!form.major.trim()) return "Major is required.";
    if (!form.experienceText.trim()) return "Experience is required.";
    if (!form.whyInterested.trim()) return "Interest statement is required.";
    if (!form.weeklyCommitment.trim()) return "Weekly commitment is required.";
    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    if (!data.cycle) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/committee-head-nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "self"
            ? {
                mode,
                cycleId: data.cycle.id,
                preferences: selectedPositions.map((positionId, index) => ({
                  positionId,
                  rank: index + 1,
                })),
                ...form,
              }
            : {
                mode,
                cycleId: data.cycle.id,
                nomineeUserId,
                suggestedPositionIds: selectedPositions,
                reason: nominationReason,
              }
        ),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Submission failed.");
        return;
      }
      setSubmitted(true);
      toast.success(
        mode === "self"
          ? "Application submitted."
          : "Nomination submitted."
      );
    } catch (error) {
      console.error("Failed to submit Committee Head nomination:", error);
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data.cycle) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Closed</Badge>
            <CardTitle>Committee Head nominations are closed</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Nominations open after the Primary Officer election handoff for the
            next semester.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            Checking sign-in...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Open</Badge>
            <CardTitle>{data.cycle.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Sign in with your RIT account to apply for a Committee Head role
              or nominate another member.
            </p>
            <Button onClick={() => signIn("google")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <CardTitle>Submitted</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {mode === "self"
                ? "Your application is in the review pool for the Primary Officers."
                : "Your nominee will be asked to accept and complete the application before Primary Officers review them."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setNomineeUserId(null);
                setNomineeName("");
                setNominationReason("");
              }}
            >
              Submit another
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
          <Badge className="w-fit">Open</Badge>
          <CardTitle>{data.cycle.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Apply for a Committee Head role or nominate someone who should be
            considered by the incoming Primary Officers.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={submit}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant={mode === "self" ? "default" : "outline"}
                onClick={() => setMode("self")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Apply for myself
              </Button>
              <Button
                type="button"
                variant={mode === "nominate" ? "default" : "outline"}
                onClick={() => setMode("nominate")}
              >
                <Send className="mr-2 h-4 w-4" />
                Nominate someone else
              </Button>
            </div>

            <section className="space-y-3">
              <div>
                <Label>Ranked position preferences</Label>
                <p className="text-xs text-muted-foreground">
                  Select every role you would accept. Use the arrows to order
                  your preferences.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.positions.map((position) => (
                  <label
                    key={position.id}
                    className="flex items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPositions.includes(position.id)}
                      onChange={() => togglePosition(position.id)}
                    />
                    <span className="font-medium">{position.title}</span>
                  </label>
                ))}
              </div>
              {sortedSelectedPositions.length > 0 && (
                <ol className="space-y-2">
                  {sortedSelectedPositions.map((position, index) => (
                    <li
                      key={position.id}
                      className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                    >
                      <span>
                        {index + 1}. {position.title}
                      </span>
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => movePosition(position.id, -1)}
                          disabled={index === 0}
                        >
                          Up
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => movePosition(position.id, 1)}
                          disabled={index === sortedSelectedPositions.length - 1}
                        >
                          Down
                        </Button>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {mode === "nominate" ? (
              <section className="space-y-4">
                <div className="space-y-2">
                  <Label>Nominee</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={nomineeName} readOnly placeholder="No nominee selected" />
                    <Button type="button" onClick={() => setUserSearchOpen(true)}>
                      Choose nominee
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Why should they be considered?</Label>
                  <Textarea
                    id="reason"
                    value={nominationReason}
                    onChange={(event) => setNominationReason(event.target.value)}
                    rows={5}
                  />
                </div>
              </section>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yearLevel">Year level</Label>
                  <select
                    id="yearLevel"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.yearLevel}
                    onChange={(event) => updateField("yearLevel", event.target.value)}
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
                    onChange={(event) => updateField("major", event.target.value)}
                  />
                </div>
                <TextAreaField
                  id="experience"
                  label="Relevant experience"
                  value={form.experienceText}
                  onChange={(value) => updateField("experienceText", value)}
                />
                <TextAreaField
                  id="why"
                  label="Why are you interested?"
                  value={form.whyInterested}
                  onChange={(value) => updateField("whyInterested", value)}
                />
                <TextAreaField
                  id="commitment"
                  label="Weekly commitment / availability"
                  value={form.weeklyCommitment}
                  onChange={(value) => updateField("weeklyCommitment", value)}
                />
                <TextAreaField
                  id="comments"
                  label="Optional notes"
                  value={form.comments}
                  onChange={(value) => updateField("comments", value)}
                  required={false}
                />
              </section>
            )}

            {data.isPrimary && (
              <p className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-muted-foreground">
                Active Primary Officers can review nominations, but cannot apply
                for Committee Head roles.
              </p>
            )}

            <Button type="submit" disabled={submitting || data.isPrimary}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <UserSearchInviteModal
        open={userSearchOpen}
        onOpenChange={setUserSearchOpen}
        title="Choose nominee"
        description="Search for the SSE member you want to nominate."
        confirmLabel="Use nominee"
        searchPlaceholder="Search by name or email..."
        onInvite={async (userId) => {
          setNomineeUserId(userId);
          setNomineeName(`User ${userId}`);
          setUserSearchOpen(false);
        }}
      />
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id}>
        {label}
        {!required && <span className="text-muted-foreground"> (optional)</span>}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
      />
    </div>
  );
}
