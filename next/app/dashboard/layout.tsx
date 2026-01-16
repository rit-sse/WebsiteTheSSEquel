"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return <>{children}</>
}
