"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { GraduationCap, Calendar, Clock, CheckCircle2, ExternalLink } from "lucide-react"
import AvailabilityGrid, { AvailabilitySlot } from "@/app/(main)/dashboard/mentoring/components/AvailabilityGrid"

interface MentorSemester {
  id: number
  name: string
  when2meetUrl: string | null
  applicationOpen: string | null
  applicationClose: string | null
  isActive: boolean
}

interface ExistingApplication {
  id: number
  status: string
  discordUsername?: string
  pronouns?: string
  major?: string
  yearLevel?: string
  coursesJson?: string
  skillsText?: string
  toolsComfortable?: string
  toolsLearning?: string
  previousSemesters?: number
  whyMentor?: string
  comments?: string | null
  semester: {
    id: number
    name: string
    isActive?: boolean
  }
}

// Course list matching the Google Form
const COURSES = [
  { id: "CSCI-141", label: "CSCI 141: Computer Science I" },
  { id: "CSCI-142", label: "CSCI 142: Computer Science II" },
  { id: "CSCI-140", label: "CS for AP Student/Transfers" },
  { id: "GCIS-123", label: "GCIS 123: Software Development & Problem Solving I" },
  { id: "GCIS-124", label: "GCIS 124: Software Development & Problem Solving II" },
  { id: "SWEN-250", label: "SWEN 250: Personal Software Engineering WITHOUT C++" },
  { id: "SWEN-251", label: "SWEN 251: Personal Software Engineering WITH C++" },
  { id: "SWEN-261-WC", label: "SWEN 261: Intro to Software Engineering (Web Checkers)" },
  { id: "SWEN-261-ES", label: "SWEN 261: Intro to Software Engineering (E-Store)" },
  { id: "SWEN-261-UF", label: "SWEN 261: Intro to Software Engineering (UFund)" },
  { id: "SWEN-344", label: "SWEN 344: Web Engineering" },
  { id: "SWEN-262", label: "SWEN 262: Engineering of Software Subsystems" },
  { id: "SWEN-331", label: "SWEN 331: Engineering Secure Software" },
  { id: "SWEN-340-MP", label: "SWEN 340: Software Design for Computing Systems (Music Player)" },
  { id: "SWEN-340-NMP", label: "SWEN 340: Software Design for Computing Systems (Not Music Player)" },
  { id: "SWEN-440", label: "SWEN 440: Software System Requirements and Architecture" },
  { id: "SWEN-444", label: "SWEN 444: Human Centered Requirements and Design" },
  { id: "CSCI-243", label: "CSCI 243: Mechanics of Programming" },
  { id: "CSCI-261", label: "CSCI 261: Analysis of Algorithms" },
  { id: "CSCI-262", label: "CSCI 262: Introduction to CS Theory" },
]

const PRONOUNS = ["She/Her", "He/Him", "They/Them", "Other"]
const MAJORS = ["Software Engineering", "Computer Science", "Other"]
const YEAR_LEVELS = ["1st", "2nd", "3rd", "4th", "5th (Undergrad)", "MS Student", "Other"]
const PREVIOUS_SEMESTERS = ["0", "1", "2", "3", "4", "5+"]

export default function MentorApplyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [activeSemester, setActiveSemester] = useState<MentorSemester | null>(null)
  const [existingApplication, setExistingApplication] = useState<ExistingApplication | null>(null)
  const [previousApplication, setPreviousApplication] = useState<ExistingApplication | null>(null)
  const [isActiveMentor, setIsActiveMentor] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAutofilled, setHasAutofilled] = useState(false)

  // Form state
  const [discordUsername, setDiscordUsername] = useState("")
  const [pronouns, setPronouns] = useState("")
  const [pronounsOther, setPronounsOther] = useState("")
  const [major, setMajor] = useState("")
  const [majorOther, setMajorOther] = useState("")
  const [yearLevel, setYearLevel] = useState("")
  const [yearLevelOther, setYearLevelOther] = useState("")
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [skillsText, setSkillsText] = useState("")
  const [toolsComfortable, setToolsComfortable] = useState("")
  const [toolsLearning, setToolsLearning] = useState("")
  const [previousSemesters, setPreviousSemesters] = useState("0")
  const [whyMentor, setWhyMentor] = useState("")
  const [comments, setComments] = useState("")
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])

  // Fetch active semester and check for existing application
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active semester
        const semesterRes = await fetch("/api/mentor-semester?activeOnly=true")
        if (semesterRes.ok) {
          const semesters = await semesterRes.json()
          if (semesters.length > 0) {
            setActiveSemester(semesters[0])
          }
        }

        // Check for existing applications and mentor status if logged in
        if (session?.user) {
          const [appRes, mentorRes] = await Promise.all([
            fetch("/api/mentor-application?my=true"),
            fetch("/api/mentor"),
          ])

          if (appRes.ok) {
            const applications = await appRes.json()
            const existing = applications.find(
              (app: ExistingApplication) => app.semester.isActive
            )
            if (existing) {
              setExistingApplication(existing)
            }
            const previous = applications.find(
              (app: ExistingApplication) => !app.semester.isActive
            )
            if (previous) {
              setPreviousApplication(previous)
            }
          }

          if (mentorRes.ok) {
            const mentors = await mentorRes.json()
            const now = new Date()
            const activeMentor = mentors.find(
              (m: { user: { email: string }; isActive: boolean; expirationDate: string }) =>
                m.user.email === session.user?.email &&
                m.isActive &&
                new Date(m.expirationDate) >= now
            )
            if (activeMentor) {
              setIsActiveMentor(true)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status !== "loading") {
      fetchData()
    }
  }, [session, status])

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    )
  }

  const parseCourses = (coursesJson?: string): string[] => {
    if (!coursesJson) return []
    try {
      const parsed = JSON.parse(coursesJson)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const applyAutofill = () => {
    if (!previousApplication) return

    const priorPronouns = previousApplication.pronouns || ""
    const priorMajor = previousApplication.major || ""
    const priorYearLevel = previousApplication.yearLevel || ""

    setDiscordUsername(previousApplication.discordUsername || "")

    if (PRONOUNS.includes(priorPronouns)) {
      setPronouns(priorPronouns)
      setPronounsOther("")
    } else if (priorPronouns) {
      setPronouns("Other")
      setPronounsOther(priorPronouns)
    }

    if (MAJORS.includes(priorMajor)) {
      setMajor(priorMajor)
      setMajorOther("")
    } else if (priorMajor) {
      setMajor("Other")
      setMajorOther(priorMajor)
    }

    if (YEAR_LEVELS.includes(priorYearLevel)) {
      setYearLevel(priorYearLevel)
      setYearLevelOther("")
    } else if (priorYearLevel) {
      setYearLevel("Other")
      setYearLevelOther(priorYearLevel)
    }

    setSelectedCourses(parseCourses(previousApplication.coursesJson))
    setSkillsText(previousApplication.skillsText || "")
    setToolsComfortable(previousApplication.toolsComfortable || "")
    setToolsLearning(previousApplication.toolsLearning || "")
    setPreviousSemesters(
      previousApplication.previousSemesters === 5 ? "5+" : `${previousApplication.previousSemesters ?? 0}`
    )
    setWhyMentor(previousApplication.whyMentor || "")
    setComments(previousApplication.comments || "")
    setAvailabilitySlots([])
    setHasAutofilled(true)
    toast.success("Autofilled from your previous application (availability cleared).")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activeSemester) {
      toast.error("No active semester for applications")
      return
    }

    // Validate form
    if (!discordUsername.trim()) {
      toast.error("Discord username is required")
      return
    }
    if (!pronouns) {
      toast.error("Please select your pronouns")
      return
    }
    if (!major) {
      toast.error("Please select your major")
      return
    }
    if (!yearLevel) {
      toast.error("Please select your year level")
      return
    }
    if (!whyMentor.trim()) {
      toast.error("Please explain why you want to be a mentor")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/mentor-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: activeSemester.id,
          discordUsername: discordUsername.trim(),
          pronouns: pronouns === "Other" ? pronounsOther.trim() : pronouns,
          major: major === "Other" ? majorOther.trim() : major,
          yearLevel: yearLevel === "Other" ? yearLevelOther.trim() : yearLevel,
          coursesJson: JSON.stringify(selectedCourses),
          skillsText: skillsText.trim(),
          toolsComfortable: toolsComfortable.trim(),
          toolsLearning: toolsLearning.trim(),
          previousSemesters: previousSemesters === "5+" ? 5 : parseInt(previousSemesters),
          whyMentor: whyMentor.trim(),
          comments: comments.trim(),
        }),
      })

      if (response.ok) {
        // Also save availability if provided
        if (availabilitySlots.length > 0) {
          try {
            await fetch("/api/mentor-availability", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                semesterId: activeSemester.id,
                slots: availabilitySlots,
              }),
            })
          } catch (availErr) {
            console.error("Error saving availability:", availErr)
            // Don't fail the application submission
          }
        }
        
        toast.success("Application submitted successfully!")
        router.push("/mentoring/apply/success")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      toast.error("An error occurred while submitting")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!session) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Become an SSE Mentor</CardTitle>
              <CardDescription>
                Sign in with your RIT Google account to apply
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                You need to be signed in to submit a mentor application. This allows us to link
                your application to your account.
              </p>
              <Button onClick={() => signIn("google", { callbackUrl: "/mentoring/apply" })}>
                Sign In to Apply
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // No active semester
  if (!activeSemester) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>Applications Not Open</CardTitle>
              <CardDescription>
                Mentor applications are not currently open
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Check back later when applications open for the next semester.
                Follow SSE on social media or join our Discord to be notified!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Check application window
  const now = new Date()
  const isBeforeOpen = activeSemester.applicationOpen && now < new Date(activeSemester.applicationOpen)
  const isAfterClose = activeSemester.applicationClose && now > new Date(activeSemester.applicationClose)

  if (isBeforeOpen) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>{activeSemester.name} Mentor Applications</CardTitle>
              <CardDescription>Applications have not opened yet</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Applications open on{" "}
                <strong>
                  {new Date(activeSemester.applicationOpen!).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isAfterClose) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>{activeSemester.name} Mentor Applications</CardTitle>
              <CardDescription>Applications have closed</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Applications closed on{" "}
                <strong>
                  {new Date(activeSemester.applicationClose!).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Already an active mentor
  if (isActiveMentor) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <CardTitle>You&apos;re already an SSE Mentor!</CardTitle>
              <CardDescription>
                You have an active mentor position this semester
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                There&apos;s no need to apply — you&apos;re already on the team.
                Check the mentor schedule or reach out to the mentoring head if you have questions.
              </p>
              <Button asChild variant="outline">
                <a href="/mentoring/schedule">View Mentor Schedule</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Already applied
  if (existingApplication) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <CardTitle>Application Submitted</CardTitle>
              <CardDescription>
                You&apos;ve already applied for {activeSemester.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Your application status:{" "}
                <span className={`font-medium ${
                  existingApplication.status === "approved" ? "text-green-600" :
                  existingApplication.status === "rejected" ? "text-red-600" :
                  existingApplication.status === "invited" ? "text-blue-600" :
                  "text-yellow-600"
                }`}>
                  {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
                </span>
              </p>
              {activeSemester.when2meetUrl && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Don&apos;t forget to fill out the When2Meet for scheduling:
                  </p>
                  <Button asChild variant="outline">
                    <a href={activeSemester.when2meetUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open When2Meet
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Application form
  return (
    <div className="min-h-screen overflow-x-hidden py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl break-words">
              {activeSemester.name} Mentor Interest Form
            </CardTitle>
            <CardDescription className="space-y-4">
              <p className="break-words">
                Hello Potential Future Mentors! Thank you for your interest in becoming a Mentor.
                This is not a &quot;sign up&quot; form, but an interest form. Please fill out the information
                below to tell us about yourself, your skills, and why you want to become a mentor.
              </p>
              <p className="break-words">
                If you are selected, we will be sending out a When2Meet to get everyone&apos;s availability
                so we can find the best mentoring times for you!
              </p>
              {activeSemester.when2meetUrl && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">When2Meet is available!</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Please also fill out the When2Meet after submitting your application:
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <a href={activeSemester.when2meetUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open When2Meet
                    </a>
                  </Button>
                </div>
              )}
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-2">Important Info:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground break-words">
                  <li>This is an unpaid position</li>
                  <li>Mentors receive 24/7 swipe access to the SSE Lab (GOL-1670)</li>
                  <li>End of semester dinner/gift from the SE department</li>
                  <li>We encourage you to have taken SWEN 261</li>
                  <li>You do NOT need to be an SE major - all majors welcome!</li>
                </ul>
              </div>
              {previousApplication && (
                <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
                  <p className="text-sm text-muted-foreground">
                    Reapplying this semester? Autofill the form with your last application.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyAutofill}
                    disabled={hasAutofilled}
                  >
                    Autofill from previous application
                  </Button>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email (from account) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={session.user?.name || ""} disabled />
                  <p className="text-xs text-muted-foreground">From your account</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={session.user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">From your account</p>
                </div>
              </div>

              {/* Discord Username */}
              <div className="space-y-2">
                <Label htmlFor="discord">
                  What is your Discord username? <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discord"
                  placeholder="username#1234 or just username"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                />
              </div>

              {/* Pronouns */}
              <div className="space-y-2">
                <Label>
                  What are your pronouns? <span className="text-destructive">*</span>
                </Label>
                <Select value={pronouns} onValueChange={setPronouns}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pronouns" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRONOUNS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pronouns === "Other" && (
                  <Input
                    placeholder="Please specify"
                    value={pronounsOther}
                    onChange={(e) => setPronounsOther(e.target.value)}
                  />
                )}
              </div>

              {/* Major */}
              <div className="space-y-2">
                <Label>
                  What is your major? <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  If you are not SE or CS, no worries! All majors are welcome!
                </p>
                <Select value={major} onValueChange={setMajor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select major" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAJORS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {major === "Other" && (
                  <Input
                    placeholder="Please specify your major"
                    value={majorOther}
                    onChange={(e) => setMajorOther(e.target.value)}
                  />
                )}
              </div>

              {/* Year Level */}
              <div className="space-y-2">
                <Label>
                  What year level are you? <span className="text-destructive">*</span>
                </Label>
                <Select value={yearLevel} onValueChange={setYearLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_LEVELS.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {yearLevel === "Other" && (
                  <Input
                    placeholder="Please specify"
                    value={yearLevelOther}
                    onChange={(e) => setYearLevelOther(e.target.value)}
                  />
                )}
              </div>

              {/* Courses */}
              <div className="space-y-2">
                <Label>
                  Which of these courses have you taken previously or are taking this semester?{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
                  {COURSES.map((course) => (
                    <div key={course.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={course.id}
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => handleCourseToggle(course.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <label
                        htmlFor={course.id}
                        className="text-sm cursor-pointer break-words"
                      >
                        {course.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Skills */}
              <div className="space-y-2">
                <Label htmlFor="skills">
                  Are there any other languages/technologies/skills that you&apos;ve learned on a
                  co-op/internship/hobby that you&apos;d feel comfortable assisting with?{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="skills"
                  placeholder="e.g., Python, AWS, Docker, React, etc."
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                />
              </div>

              {/* Previous Semesters */}
              <div className="space-y-2">
                <Label>
                  How many semesters have you mentored for in the past?{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={previousSemesters} onValueChange={setPreviousSemesters}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREVIOUS_SEMESTERS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tools Comfortable */}
              <div className="space-y-2">
                <Label htmlFor="toolsComfortable">
                  What tools/technologies are you most comfortable working with?{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="toolsComfortable"
                  placeholder="e.g., IntelliJ, VS Code, Git, Linux, etc."
                  value={toolsComfortable}
                  onChange={(e) => setToolsComfortable(e.target.value)}
                />
              </div>

              {/* Tools Learning */}
              <div className="space-y-2">
                <Label htmlFor="toolsLearning">
                  What tools/technologies are you currently learning?{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="toolsLearning"
                  placeholder="e.g., Kubernetes, GraphQL, Rust, etc."
                  value={toolsLearning}
                  onChange={(e) => setToolsLearning(e.target.value)}
                />
              </div>

              {/* Why Mentor */}
              <div className="space-y-2">
                <Label htmlFor="whyMentor">
                  Why are you interested in being a mentor, and why do you think you would make a
                  good mentor? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="whyMentor"
                  placeholder="Tell us about your motivation and what makes you a good fit..."
                  value={whyMentor}
                  onChange={(e) => setWhyMentor(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Label>
                  When are you available to mentor? <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select all time slots when you could be available to help in the SSE lab.
                  This helps us create a schedule that works for everyone.
                </p>
                <div className="border rounded-lg p-2 sm:p-4 bg-muted/20">
                  <AvailabilityGrid
                    value={availabilitySlots}
                    onChange={setAvailabilitySlots}
                    className="max-w-full"
                  />
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">Any comments/questions/concerns?</Label>
                <Textarea
                  id="comments"
                  placeholder="Optional"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
