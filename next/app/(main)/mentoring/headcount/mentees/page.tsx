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

interface Course {
  id: number;
  title: string;
  code: number;
  department: {
    shortTitle: string;
  };
}

export default function MenteeHeadcountPage() {
  const { data: session, status } = useSession();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [semester, setSemester] = useState<MentorSemester | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<number[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [studentsMentoredCount, setStudentsMentoredCount] = useState("");
  const [testsCheckedOutCount, setTestsCheckedOutCount] = useState("");
  const [otherClassText, setOtherClassText] = useState("");
  const [noClassHelp, setNoClassHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMentors = useMemo(() => {
    const now = new Date();
    return mentors.filter((mentor) => mentor.isActive && new Date(mentor.expirationDate) >= now);
  }, [mentors]);

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => {
      const aCode = `${a.department.shortTitle}-${a.code}`;
      const bCode = `${b.department.shortTitle}-${b.code}`;
      return aCode.localeCompare(bCode);
    });
  }, [courses]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadData = async () => {
      try {
        const [mentorRes, semesterRes, courseRes] = await Promise.all([
          fetch("/api/mentor"),
          fetch("/api/mentor-semester?activeOnly=true"),
          fetch("/api/course"),
        ]);

        if (mentorRes.ok) {
          const mentorData = await mentorRes.json();
          setMentors(mentorData);
        }

        if (semesterRes.ok) {
          const semesterData = await semesterRes.json();
          setSemester(semesterData[0] ?? null);
        }

        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setCourses(courseData);
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

  const toggleCourse = (courseId: number) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleNoClassHelp = (checked: boolean) => {
    setNoClassHelp(checked);
    if (checked) {
      setSelectedCourses([]);
      setOtherClassText("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedMentors.length === 0) {
      toast.error("Select at least one mentor on duty.");
      return;
    }

    const studentCount = parseInt(studentsMentoredCount, 10);
    const testCount = parseInt(testsCheckedOutCount, 10);

    if (Number.isNaN(studentCount) || studentCount < 0) {
      toast.error("Enter a valid number of students mentored.");
      return;
    }

    if (Number.isNaN(testCount) || testCount < 0) {
      toast.error("Enter a valid number of tests checked out.");
      return;
    }

    setIsSubmitting(true);

    const otherText = noClassHelp ? "N/A" : otherClassText.trim();

    try {
      const response = await fetch("/api/mentee-headcount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorIds: selectedMentors,
          studentsMentoredCount: studentCount,
          testsCheckedOutCount: testCount,
          courseIds: selectedCourses,
          otherClassText: otherText || null,
          semesterId: semester?.id,
        }),
      });

      if (response.ok) {
        toast.success("Headcount submitted. Thank you!");
        setSelectedMentors([]);
        setSelectedCourses([]);
        setStudentsMentoredCount("");
        setTestsCheckedOutCount("");
        setOtherClassText("");
        setNoClassHelp(false);
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
        <h1 className="text-2xl font-bold">Mentee Headcount</h1>
        <p className="text-muted-foreground">Please sign in to submit headcount.</p>
        <Button onClick={() => signIn("google")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">55-minute SSE Mentoring Mentee Headcount</h1>
        <p className="text-muted-foreground mt-1">
          {semester ? `${semester.name} •` : ""} Capture mentee support metrics.
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
            <NeoCardTitle>Counts</NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentsMentored">
                SELECT COUNT(DISTINCT student) FROM students_mentored_or_mentoring;
              </Label>
              <Input
                id="studentsMentored"
                type="number"
                min={0}
                value={studentsMentoredCount}
                onChange={(event) => setStudentsMentoredCount(event.target.value)}
                placeholder="Number of students mentored"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testsCheckedOut">
                SELECT COUNT(DISTINCT student) FROM students_who_checked_out_tests;
              </Label>
              <Input
                id="testsCheckedOut"
                type="number"
                min={0}
                value={testsCheckedOutCount}
                onChange={(event) => setTestsCheckedOutCount(event.target.value)}
                placeholder="Number of students who checked out tests"
              />
            </div>
          </NeoCardContent>
        </NeoCard>

        <NeoCard>
          <NeoCardHeader>
            <NeoCardTitle>Which classes did the mentee(s) need help with?</NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {sortedCourses.map((course) => {
                const code = `${course.department.shortTitle} ${course.code}`;
                return (
                  <label key={course.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedCourses.includes(course.id)}
                      onCheckedChange={() => toggleCourse(course.id)}
                      disabled={noClassHelp}
                    />
                    <span>{code}</span>
                  </label>
                );
              })}
            </div>

            <label className="flex items-center gap-2">
              <Checkbox checked={noClassHelp} onCheckedChange={handleNoClassHelp} />
              <span>N/A</span>
            </label>

            <div className="space-y-2">
              <Label htmlFor="otherClass">Other</Label>
              <Textarea
                id="otherClass"
                value={otherClassText}
                onChange={(event) => setOtherClassText(event.target.value)}
                placeholder="Other class (optional)"
                rows={2}
                disabled={noClassHelp}
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
