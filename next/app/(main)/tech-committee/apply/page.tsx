"use client";

import React, { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const YEAR_LEVELS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th (Undergrad)",
  "MS Student",
  "Other",
];

const DIVISIONS = [
  {
    value: "Web Division",
    description:
      "Builds and maintains the SSE website and related web tooling.",
  },
  {
    value: "Lab Division",
    description:
      "Supports lab systems, devices, and operational technology used in the space.",
  },
  {
    value: "Services Division",
    description:
      "Owns supporting technical services for the organization and our users.",
  },
];

export default function TechCommitteeApplyPage() {
  const { data: session, status } = useSession();
  const [yearLevel, setYearLevel] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [weeklyCommitment, setWeeklyCommitment] = useState("");
  const [preferredDivision, setPreferredDivision] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(true);
  const [hasActiveApplication, setHasActiveApplication] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const accountName = useMemo(() => session?.user?.name ?? "", [session]);
  const accountEmail = useMemo(() => session?.user?.email ?? "", [session]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    const fetchApplicationState = async () => {
      try {
        const statusRes = await fetch(
          "/api/tech-committee-application?status=true"
        );
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setIsApplicationOpen(statusData.isOpen !== false);
        }

        if (session?.user) {
          const myAppsRes = await fetch(
            "/api/tech-committee-application?my=true"
          );
          if (myAppsRes.ok) {
            const myApps = await myAppsRes.json();
            const hasActive = myApps.some(
              (application: { status: string }) =>
                application.status === "pending" ||
                application.status === "approved" ||
                application.status === "assigned"
            );
            setHasActiveApplication(hasActive);
          }
        } else {
          setHasActiveApplication(false);
        }
      } catch (error) {
        console.error("Failed to fetch Tech Committee application state:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchApplicationState();
  }, [session, status]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accountName.trim() || !accountEmail.trim()) {
      toast.error("You must be signed in to submit an application.");
      return;
    }
    if (!yearLevel) {
      toast.error("Year level is required.");
      return;
    }
    if (!experienceText.trim()) {
      toast.error("Experience is required.");
      return;
    }
    if (!whyJoin.trim()) {
      toast.error("Why you want to join is required.");
      return;
    }
    if (!weeklyCommitment.trim()) {
      toast.error("Weekly commitment is required.");
      return;
    }
    if (!preferredDivision) {
      toast.error("Preferred division is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tech-committee-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: accountName,
          ritEmail: accountEmail,
          yearLevel,
          experienceText,
          whyJoin,
          weeklyCommitment,
          preferredDivision,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to submit Tech Committee application.");
        return;
      }

      toast.success("Tech Committee application submitted.");
      setYearLevel("");
      setExperienceText("");
      setWhyJoin("");
      setWeeklyCommitment("");
      setPreferredDivision("");
    } catch (error) {
      console.error("Failed to submit Tech Committee application:", error);
      toast.error("Failed to submit Tech Committee application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isPageLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl justify-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <CardDescription>Checking your session and application status.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto flex w-full max-w-3xl px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Tech Committee Applications</CardTitle>
            <CardDescription>
              You must be signed in to apply. This lets us attach your submission to
              your SSE account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => signIn("google")}>Sign In to Apply</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isApplicationOpen) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Tech Committee Applications</CardTitle>
            <CardDescription>
              Applications are currently closed. Check back later when Tech Committee
              applications reopen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (hasActiveApplication) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Application Already Submitted</CardTitle>
            <CardDescription>
              You already have an active Tech Committee application. You cannot submit
              another one right now.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Tech Committee Application</CardTitle>
          <CardDescription>
            Submit your interest in joining Tech Committee. Your name and RIT email
            are taken from your signed-in account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={accountName} disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rit-email">RIT Email</Label>
                <Input id="rit-email" value={accountEmail} disabled readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-level">Year Level</Label>
              <Select value={yearLevel} onValueChange={setYearLevel}>
                <SelectTrigger id="year-level">
                  <SelectValue placeholder="Select your year level" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_LEVELS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Textarea
                id="experience"
                value={experienceText}
                onChange={(event) => setExperienceText(event.target.value)}
                placeholder="Projects, courses, co-op experience, or other relevant technical work."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="why-join">Why do you want to join?</Label>
              <Textarea
                id="why-join"
                value={whyJoin}
                onChange={(event) => setWhyJoin(event.target.value)}
                placeholder="Tell us why Tech Committee is a good fit for you."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly-commitment">Weekly Time Commitment</Label>
              <Input
                id="weekly-commitment"
                value={weeklyCommitment}
                onChange={(event) => setWeeklyCommitment(event.target.value)}
                placeholder="e.g. 4-6 hours per week"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="preferred-division">Preferred Division</Label>
              <Select value={preferredDivision} onValueChange={setPreferredDivision}>
                <SelectTrigger id="preferred-division">
                  <SelectValue placeholder="Select your preferred division" />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((division) => (
                    <SelectItem key={division.value} value={division.value}>
                      {division.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-3 rounded-lg border p-4">
                {DIVISIONS.map((division) => (
                  <div key={division.value}>
                    <p className="font-medium">{division.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {division.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
