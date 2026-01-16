"use client"

import LeadershipStatusCard from "./LeadershipStatusCard"
import AlumniRequestsSection from "./AlumniRequestsSection"

export default function DashboardOverview() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <LeadershipStatusCard />
      <AlumniRequestsSection />
    </div>
  )
}
