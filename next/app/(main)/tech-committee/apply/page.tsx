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
import { TECH_COMMITTEE_APPLICATION_LIMITS } from "@/lib/techCommitteeApplication";
import { TECH_COMMITTEE_DIVISION_OPTIONS } from "@/lib/utils";
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

export default function TechCommitteeApplyPage() {
  const { data: session, status } = useSession();
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [yearLevel, setYearLevel] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [weeklyCommitment, setWeeklyCommitment] = useState("");
  const [preferredDivision, setPreferredDivision] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(true);
  const [hasActiveApplication, setHasActiveApplication] = useState(false);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
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
            const pendingApplication = myApps.find(
              (application: {
                id: number;
                status: string;
                yearLevel: string;
                experienceText: string;
                whyJoin: string;
                weeklyCommitment: string;
                preferredDivision: string;
              }) => application.status === "PENDING"
            );
            if (pendingApplication) {
              setApplicationId(pendingApplication.id);
              setYearLevel(pendingApplication.yearLevel);
              setExperienceText(pendingApplication.experienceText);
              setWhyJoin(pendingApplication.whyJoin);
              setWeeklyCommitment(pendingApplication.weeklyCommitment);
              setPreferredDivision(pendingApplication.preferredDivision);
              setHasPendingApplication(true);
            } else {
              setApplicationId(null);
              setHasPendingApplication(false);
            }
            const hasActive = myApps.some(
              (application: { status: string }) =>
                application.status === "PENDING" ||
                application.status === "APPROVED" ||
                application.status === "ASSIGNED"
            );
            setHasActiveApplication(hasActive);
          }
        } else {
          setHasActiveApplication(false);
        }
      } catch (error) {
        console.error(
          "Failed to fetch Tech Committee application state:",
          error
        );
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
        method: hasPendingApplication ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: applicationId,
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
        toast.error(
          data.error || "Failed to submit Tech Committee application."
        );
        return;
      }

      if (hasPendingApplication) {
        toast.success("Tech Committee application updated.");
      } else {
        toast.success("Tech Committee application submitted.");
        setHasActiveApplication(true);
      }
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
            <CardDescription>
              Checking your session and application status.
            </CardDescription>
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
              You must be signed in to apply. This lets us attach your
              submission to your SSE account.
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
              Applications are currently closed. Check back later when Tech
              Committee applications reopen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (hasActiveApplication && !hasPendingApplication) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Application Already Submitted</CardTitle>
            <CardDescription>
              You already have an active Tech Committee application. You cannot
              submit another one right now.
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
            {hasPendingApplication
              ? "You have a pending application. You can keep editing it here until it is reviewed."
              : "Submit your interest in joining Tech Committee. Your name and RIT email are taken from your signed-in account."}
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
                maxLength={TECH_COMMITTEE_APPLICATION_LIMITS.experienceText}
              />
              <p className="text-xs text-muted-foreground">
                {experienceText.length}/
                {TECH_COMMITTEE_APPLICATION_LIMITS.experienceText}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="why-join">Why do you want to join?</Label>
              <Textarea
                id="why-join"
                value={whyJoin}
                onChange={(event) => setWhyJoin(event.target.value)}
                placeholder="Tell us why Tech Committee is a good fit for you."
                rows={5}
                maxLength={TECH_COMMITTEE_APPLICATION_LIMITS.whyJoin}
              />
              <p className="text-xs text-muted-foreground">
                {whyJoin.length}/{TECH_COMMITTEE_APPLICATION_LIMITS.whyJoin}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly-commitment">Weekly Time Commitment</Label>
              <Input
                id="weekly-commitment"
                value={weeklyCommitment}
                onChange={(event) => setWeeklyCommitment(event.target.value)}
                placeholder="e.g. 4-6 hours per week"
                maxLength={TECH_COMMITTEE_APPLICATION_LIMITS.weeklyCommitment}
              />
              <p className="text-xs text-muted-foreground">
                {weeklyCommitment.length}/
                {TECH_COMMITTEE_APPLICATION_LIMITS.weeklyCommitment}
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="preferred-division">Preferred Division</Label>
              <Select
                value={preferredDivision}
                onValueChange={setPreferredDivision}
              >
                <SelectTrigger id="preferred-division">
                  <SelectValue placeholder="Select your preferred division" />
                </SelectTrigger>
                <SelectContent>
                  {TECH_COMMITTEE_DIVISION_OPTIONS.map((division) => (
                    <SelectItem key={division.value} value={division.value}>
                      {division.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-3 rounded-lg border p-4">
                {TECH_COMMITTEE_DIVISION_OPTIONS.map((division) => (
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
              {isSubmitting
                ? hasPendingApplication
                  ? "Saving..."
                  : "Submitting..."
                : hasPendingApplication
                  ? "Save Application"
                  : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
