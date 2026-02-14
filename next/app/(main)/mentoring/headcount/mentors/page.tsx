"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from "@/components/ui/neo-card";
import { toast } from "sonner";

interface Mentor {
  id: number;
  isActive: boolean;
  expirationDate: string;
  user: {
    name: string;
    email: string;
  };
}

interface MentorSemester {
  id: number;
  name: string;
  isActive: boolean;
}

export default function MentorHeadcountPage() {
  const { data: session, status } = useSession();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [semester, setSemester] = useState<MentorSemester | null>(null);
  const [selectedMentors, setSelectedMentors] = useState<number[]>([]);
  const [peopleInLab, setPeopleInLab] = useState("");
  const [feeling, setFeeling] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMentors = useMemo(() => {
    const now = new Date();
    return mentors.filter((mentor) => mentor.isActive && new Date(mentor.expirationDate) >= now);
  }, [mentors]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadData = async () => {
      try {
        const [mentorRes, semesterRes] = await Promise.all([
          fetch("/api/mentor"),
          fetch("/api/mentor-semester?activeOnly=true"),
        ]);

        if (mentorRes.ok) {
          const mentorData = await mentorRes.json();
          setMentors(mentorData);
        }

        if (semesterRes.ok) {
          const semesterData = await semesterRes.json();
          setSemester(semesterData[0] ?? null);
        }
      } catch (error) {
        console.error("Failed to load headcount data:", error);
      }
    };

    loadData();
  }, [status]);

  const toggleMentor = (mentorId: number) => {
    setSelectedMentors((prev) =>
      prev.includes(mentorId) ? prev.filter((id) => id !== mentorId) : [...prev, mentorId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedMentors.length === 0) {
      toast.error("Select at least one mentor on duty.");
      return;
    }

    const peopleCount = parseInt(peopleInLab, 10);
    if (Number.isNaN(peopleCount) || peopleCount < 0) {
      toast.error("Enter a valid number of people in the lab.");
      return;
    }

    if (!feeling.trim()) {
      toast.error("Please share how you're doing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/mentoring-headcount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorIds: selectedMentors,
          peopleInLab: peopleCount,
          feeling,
          semesterId: semester?.id,
        }),
      });

      if (response.ok) {
        toast.success("Headcount submitted. Thank you!");
        setSelectedMentors([]);
        setPeopleInLab("");
        setFeeling("");
      } else {
        const text = await response.text();
        toast.error(text || "Failed to submit headcount.");
      }
    } catch (error) {
      console.error("Failed to submit headcount:", error);
      toast.error("An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return <div className="p-8 text-muted-foreground">Loading headcount form...</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Mentor Headcount</h1>
        <p className="text-muted-foreground">Please sign in to submit headcount.</p>
        <Button onClick={() => signIn("google")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">30-minute SSE Mentoring Lab Headcount</h1>
        <p className="text-muted-foreground mt-1">
          {semester ? `${semester.name} •` : ""} Quick check-in for mentors on duty.
        </p>
      </div>

      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle>Mentors on Duty</NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {activeMentors.map((mentor) => (
              <label key={mentor.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMentors.includes(mentor.id)}
                  onCheckedChange={() => toggleMentor(mentor.id)}
                />
                <span>{mentor.user.name}</span>
              </label>
            ))}
          </div>
        </NeoCardContent>
      </NeoCard>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <NeoCard>
          <NeoCardHeader>
            <NeoCardTitle>Lab Snapshot</NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="peopleInLab">Number of people in the lab right now</Label>
              <Input
                id="peopleInLab"
                type="number"
                min={0}
                value={peopleInLab}
                onChange={(event) => setPeopleInLab(event.target.value)}
                placeholder="e.g., 12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeling">How are you doing? (Answer this, or else)</Label>
              <Textarea
                id="feeling"
                value={feeling}
                onChange={(event) => setFeeling(event.target.value)}
                placeholder="Tell us how you’re feeling today."
                rows={3}
              />
            </div>
          </NeoCardContent>
        </NeoCard>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Headcount"}
        </Button>
      </form>
    </div>
  );
}
