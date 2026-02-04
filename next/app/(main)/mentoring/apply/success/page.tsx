"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckCircle2, Home, Calendar } from "lucide-react"

interface MentorSemester {
  id: number
  name: string
}

export default function ApplicationSuccessPage() {
  const [activeSemester, setActiveSemester] = useState<MentorSemester | null>(null)

  useEffect(() => {
    const fetchSemester = async () => {
      try {
        const res = await fetch("/api/mentor-semester?activeOnly=true")
        if (res.ok) {
          const semesters = await res.json()
          if (semesters.length > 0) {
            setActiveSemester(semesters[0])
          }
        }
      } catch (error) {
        console.error("Error fetching semester:", error)
      }
    }
    fetchSemester()
  }, [])

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>
            Thank you for applying to be an SSE Mentor
            {activeSemester ? ` for ${activeSemester.name}` : ""}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>
              We will review your application and get back to you soon. Keep an eye on your
              email for updates!
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg text-center">
            <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="font-medium mb-1">Availability Saved</p>
            <p className="text-sm text-muted-foreground">
              Your availability has been recorded with your application. We&apos;ll use this to
              create the mentor schedule.
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Join the{" "}
              <a
                href="https://discord.gg/3MTjechws9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                SSE Discord
              </a>{" "}
              to stay connected with the mentoring team!
            </p>
          </div>

          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
