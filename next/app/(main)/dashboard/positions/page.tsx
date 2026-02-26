"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, GraduationCap, History } from "lucide-react"
import PositionsSection from "../PositionsSection"
import MentorSection from "../MentorSection"
import HistoricalOfficersSection from "../HistoricalOfficersSection"

export default function PositionsPage() {
  const [activeTab, setActiveTab] = useState("officers")

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="officers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Officers
          </TabsTrigger>
          <TabsTrigger value="mentors" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Mentors
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="officers" className="space-y-4">
          <PositionsSection />
        </TabsContent>
        <TabsContent value="mentors" className="space-y-4">
          <MentorSection />
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <HistoricalOfficersSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
