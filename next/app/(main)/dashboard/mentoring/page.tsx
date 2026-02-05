"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, ClipboardList, Megaphone } from "lucide-react"
import MentorScheduleEditor from "./components/MentorScheduleEditor"
import MentorRosterManager from "./components/MentorRosterManager"
import SemesterManager from "./components/SemesterManager"
import ApplicationReview from "./components/ApplicationReview"

export default function MentoringDashboardPage() {
  const [activeTab, setActiveTab] = useState("schedule")

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mentor Operations</h1>
        <p className="text-muted-foreground mt-1">
          Manage mentor recruitment, schedules, and roster
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 gap-1">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="roster" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Recruitment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <MentorScheduleEditor />
        </TabsContent>

        <TabsContent value="roster" className="space-y-4">
          <MentorRosterManager />
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <ApplicationReview />
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-4">
          <SemesterManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
