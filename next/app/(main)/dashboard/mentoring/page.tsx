"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, ClipboardList, Megaphone, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import MentorScheduleEditor from "./components/MentorScheduleEditor"
import MentorRosterManager from "./components/MentorRosterManager"
import SemesterManager from "./components/SemesterManager"
import ApplicationReview from "./components/ApplicationReview"
import HeadcountDashboard from "./components/HeadcountDashboard"

/**
 * Small wrapper that portals children into a target DOM node.
 * Used so MentorScheduleEditor can render its toolbar buttons
 * into the page-level tab bar without lifting all that state up.
 */
function ToolbarPortal({ target, children }: { target: HTMLElement | null; children: React.ReactNode }) {
  if (!target) return null
  return createPortal(children, target)
}

export default function MentoringDashboardPage() {
  const [activeTab, setActiveTab] = useState("schedule")
  const [activeSemesterName, setActiveSemesterName] = useState<string | null>(null)
  const [hasAvailabilityUpdates, setHasAvailabilityUpdates] = useState(false)
  const [latestUnseenUpdateAt, setLatestUnseenUpdateAt] = useState<number>(0)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [toolbarNode, setToolbarNode] = useState<HTMLDivElement | null>(null)

  // Once ref mounts, expose the DOM node so children can portal into it
  useEffect(() => {
    setToolbarNode(toolbarRef.current)
  }, [])

  useEffect(() => {
    const loadSemester = async () => {
      try {
        const response = await fetch("/api/mentor-semester?activeOnly=true")
        if (!response.ok) return
        const semesters = await response.json()
        const name = semesters?.[0]?.name
        if (typeof name === "string" && name.trim().length > 0) {
          setActiveSemesterName(name)
        }
      } catch {
        // No-op: title gracefully falls back
      }
    }
    loadSemester()
  }, [])

  useEffect(() => {
    const checkMentorAvailabilityUpdates = async () => {
      try {
        const authRes = await fetch("/api/authLevel")
        if (!authRes.ok) return
        const authLevel = await authRes.json()
        if (!authLevel?.isMentoringHead) return

        const updatesRes = await fetch("/api/mentor-availability/updates")
        if (!updatesRes.ok) return

        const updates = await updatesRes.json()
        const latestUpdatedAt = updates?.latestUpdatedAt ? Date.parse(updates.latestUpdatedAt) : 0
        const seenAt = Number(localStorage.getItem("mentor-availability-last-seen") || "0")
        const hasUnseen = latestUpdatedAt > seenAt

        if (hasUnseen) {
          const unseenUpdates = Array.isArray(updates?.updates)
            ? updates.updates.filter((entry: { updatedAt?: string }) => {
                const timestamp = entry?.updatedAt ? Date.parse(entry.updatedAt) : 0
                return timestamp > seenAt
              })
            : []

          if (unseenUpdates.length === 0) {
            toast.info("Mentor availability was updated.")
          } else {
            const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"]
            unseenUpdates.forEach((entry: {
              user?: { name?: string }
              removedBlocks?: Array<{ weekday: number; startHour: number }>
            }) => {
              const name = entry?.user?.name || "A mentor"
              const removedBlocks = Array.isArray(entry?.removedBlocks) ? entry.removedBlocks : []
              if (removedBlocks.length > 0) {
                const labels = removedBlocks
                  .slice(0, 2)
                  .map((block) => `${dayNames[(block.weekday ?? 1) - 1] ?? "Day"} ${block.startHour}:00`)
                  .join(", ")
                const suffix = removedBlocks.length > 2 ? ` +${removedBlocks.length - 2} more` : ""
                toast.info(`${name} updated availability and was removed from ${labels}${suffix}.`)
              } else {
                toast.info(`${name} updated availability.`)
              }
            })
          }

          setLatestUnseenUpdateAt(latestUpdatedAt)
          setHasAvailabilityUpdates(true)
        }
      } catch (error) {
        console.error("Failed to check mentor availability updates:", error)
      }
    }

    checkMentorAvailabilityUpdates()
  }, [])

  useEffect(() => {
    if (activeTab !== "schedule" || !hasAvailabilityUpdates || latestUnseenUpdateAt <= 0) {
      return
    }
    localStorage.setItem("mentor-availability-last-seen", String(latestUnseenUpdateAt))
    window.dispatchEvent(new Event("mentor-availability-seen"))
    setHasAvailabilityUpdates(false)
  }, [activeTab, hasAvailabilityUpdates, latestUnseenUpdateAt])

  const titleSuffix = activeSemesterName
    ? activeSemesterName.replace(/^([A-Za-z]+)\s+(\d{4})$/, (_, term: string, year: string) => {
        return `${term} ${year.slice(-2)}`
      })
    : null

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card depth={1}>
        <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Mentor Operations{titleSuffix ? ` - ${titleSuffix}` : ""}
              </h1>
              {hasAvailabilityUpdates && (
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Schedules, roster, applications, recruitment, and headcount
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <TabsList className="inline-flex w-auto gap-1">
                <TabsTrigger value="schedule" className="flex items-center gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Schedule</span>
                  <span className="sm:hidden">Sched</span>
                </TabsTrigger>
                <TabsTrigger value="roster" className="flex items-center gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Users className="h-3.5 w-3.5" />
                  Roster
                </TabsTrigger>
                <TabsTrigger value="applications" className="flex items-center gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3">
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Applications</span>
                  <span className="sm:hidden">Apps</span>
                </TabsTrigger>
                <TabsTrigger value="recruitment" className="flex items-center gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Megaphone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Recruitment</span>
                  <span className="sm:hidden">Recruit</span>
                </TabsTrigger>
                <TabsTrigger value="headcount" className="flex items-center gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Headcount</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
              </TabsList>

              {/* Schedule toolbar buttons get portaled here */}
              <div ref={toolbarRef} className="flex items-center gap-1.5 ml-auto" />
            </div>

            <TabsContent value="schedule">
              <MentorScheduleEditor ToolbarPortal={ToolbarPortal} toolbarNode={toolbarNode} />
            </TabsContent>

            <TabsContent value="roster">
              <MentorRosterManager />
            </TabsContent>

            <TabsContent value="applications">
              <ApplicationReview />
            </TabsContent>

            <TabsContent value="recruitment">
              <SemesterManager />
            </TabsContent>

            <TabsContent value="headcount">
              <HeadcountDashboard />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
