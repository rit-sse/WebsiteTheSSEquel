"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, ClipboardList, Megaphone, BarChart3 } from "lucide-react"
import MentorScheduleEditor from "./components/MentorScheduleEditor"
import MentorRosterManager from "./components/MentorRosterManager"
import SemesterManager from "./components/SemesterManager"
import ApplicationReview from "./components/ApplicationReview"
import HeadcountDashboard from "./components/HeadcountDashboard"

export default function MentoringDashboardPage() {
  const [activeTab, setActiveTab] = useState("schedule")

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Mentor Operations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Schedules, roster, applications, recruitment, and headcount
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
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

        <TabsContent value="schedule">
          <MentorScheduleEditor />
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
    </div>
  )
}
