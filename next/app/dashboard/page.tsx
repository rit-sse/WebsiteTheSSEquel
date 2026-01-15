"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LeadershipStatusCard from "./LeadershipStatusCard"
import AlumniRequestsSection from "./AlumniRequestsSection"
import UsersSection from "./UsersSection"
import PositionsSection from "./PositionsSection"
import OfficersSection from "./OfficersSection"
import { Users, Briefcase, UserCog, GraduationCap, LayoutDashboard } from "lucide-react"

export default function Dashboard() {
  const [isOfficer, setIsOfficer] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/authLevel")
      const data = await response.json()
      setIsOfficer(data.isOfficer)
    } catch (error) {
      console.error("Error checking auth:", error)
      setIsOfficer(false)
    }
  }

  // Loading state
  if (isOfficer === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Not authorized
  if (!isOfficer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card depth={2} className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You must be an officer to access the dashboard.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <LayoutDashboard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">Semester Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage club operations and track semester progress
              </p>
            </div>
          </div>
        </div>

        {/* Status Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <LeadershipStatusCard />
          
          {/* Placeholder for future status cards */}
          <Card depth={2} className="p-4 sm:p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-xs sm:text-sm">More status cards coming soon</p>
              <p className="text-xs text-muted-foreground mt-1">
                (Mentors, Events, Budget, etc.)
              </p>
            </div>
          </Card>
        </div>

        {/* Alumni Requests Section */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Alumni Requests</h2>
          </div>
          <AlumniRequestsSection />
        </section>

        {/* Management Section */}
        <section>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Management</h2>
          </div>
          
          <Card depth={2} className="p-3 sm:p-6">
            <Tabs defaultValue="officers" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="officers" className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span>Officers</span>
                </TabsTrigger>
                <TabsTrigger value="positions" className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                  <UserCog className="h-4 w-4 shrink-0" />
                  <span>Positions</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Users</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="officers">
                <div className="mb-4">
                  <h3 className="font-medium text-foreground text-sm sm:text-base">Officer Assignments</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Manage who holds each officer position
                  </p>
                </div>
                <OfficersSection />
              </TabsContent>

              <TabsContent value="positions">
                <div className="mb-4">
                  <h3 className="font-medium text-foreground text-sm sm:text-base">Officer Positions</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Define the available positions (roles) in the organization
                  </p>
                </div>
                <PositionsSection />
              </TabsContent>

              <TabsContent value="users">
                <div className="mb-4">
                  <h3 className="font-medium text-foreground text-sm sm:text-base">User Management</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Manage all users in the system
                  </p>
                </div>
                <UsersSection />
              </TabsContent>
            </Tabs>
          </Card>
        </section>

        {/* Future Expansion Placeholder */}
        <section className="mt-8">
          <Card depth={1} className="p-6 border-dashed">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              Future features: Mentor management, Event planning, Committee tasks, Budget tracking, and more.
            </p>
          </Card>
        </section>
      </div>
    </div>
  )
}
