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

const DEFAULT_COURSES = [
  { code: "CSCI-141", label: "CSCI 141" },
  { code: "CSCI-142", label: "CSCI 142" },
  { code: "CSCI-140", label: "CSCI 140" },
  { code: "GCIS-123", label: "GCIS 123" },
  { code: "GCIS-124", label: "GCIS 124" },
  { code: "SWEN-250", label: "SWEN 250" },
  { code: "SWEN-251", label: "SWEN 251" },
  { code: "SWEN-261-WC", label: "SWEN 261 (Web Checkers)" },
  { code: "SWEN-261-ES", label: "SWEN 261 (E-Store)" },
  { code: "SWEN-261-UF", label: "SWEN 261 (UFund)" },
  { code: "SWEN-262", label: "SWEN 262" },
  { code: "SWEN-331", label: "SWEN 331" },
  { code: "SWEN-340-MP", label: "SWEN 340 (Music Player)" },
  { code: "SWEN-340-NMP", label: "SWEN 340 (Not Music Player)" },
  { code: "SWEN-344", label: "SWEN 344" },
  { code: "SWEN-440", label: "SWEN 440" },
  { code: "SWEN-444", label: "SWEN 444" },
  { code: "CSCI-243", label: "CSCI 243" },
  { code: "CSCI-261", label: "CSCI 261" },
  { code: "CSCI-262", label: "CSCI 262" },
];

export default function MenteeHeadcountPage() {
  const { data: session, status } = useSession();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [semester, setSemester] = useState<MentorSemester | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<number[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [studentsMentoredCount, setStudentsMentoredCount] = useState("");
  const [testsCheckedOutCount, setTestsCheckedOutCount] = useState("");
  const [otherClassText, setOtherClassText] = useState("");
  const [noClassHelp, setNoClassHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMentors = useMemo(() => {
    const now = new Date();
    return mentors.filter((mentor) => mentor.isActive && new Date(mentor.expirationDate) >= now);
  }, [mentors]);

  const courseCodeMap = useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((course) => {
      map.set(`${course.department.shortTitle}-${course.code}`.toUpperCase(), course.id);
    });
    return map;
  }, [courses]);

  const sortedCourses = useMemo(() => {
    const combined = DEFAULT_COURSES.map((course) => ({
      code: course.code,
      label: course.label,
    }));
    combined.sort((a, b) => a.code.localeCompare(b.code));
    return combined;
  }, []);

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

  const toggleCourse = (courseCode: string) => {
    setSelectedCourseCodes((prev) =>
      prev.includes(courseCode)
        ? prev.filter((code) => code !== courseCode)
        : [...prev, courseCode]
    );
  };

  const handleNoClassHelp = (checked: boolean) => {
    setNoClassHelp(checked);
    if (checked) {
      setSelectedCourses([]);
      setSelectedCourseCodes([]);
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

    const mappedCourseIds = selectedCourseCodes
      .map((code) => courseCodeMap.get(code.toUpperCase()))
      .filter((id): id is number => !!id);
    setSelectedCourses(mappedCourseIds);

    const unmappedCourses = selectedCourseCodes.filter(
      (code) => !courseCodeMap.has(code.toUpperCase())
    );
    const otherText = noClassHelp
      ? "N/A"
      : [otherClassText.trim(), ...unmappedCourses].filter(Boolean).join(", ");

    try {
      const response = await fetch("/api/mentee-headcount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorIds: selectedMentors,
          studentsMentoredCount: studentCount,
          testsCheckedOutCount: testCount,
          courseIds: mappedCourseIds,
          otherClassText: otherText || null,
          semesterId: semester?.id,
        }),
      });

      if (response.ok) {
        toast.success("Headcount submitted. Thank you!");
        setSelectedMentors([]);
        setSelectedCourses([]);
        setSelectedCourseCodes([]);
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
              {sortedCourses.map((course) => (
                <label key={course.code} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCourseCodes.includes(course.code)}
                    onCheckedChange={() => toggleCourse(course.code)}
                    disabled={noClassHelp}
                  />
                  <span>{course.label}</span>
                </label>
              ))}
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
