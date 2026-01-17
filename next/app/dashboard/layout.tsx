"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  const checkAuth = useCallback(async () => {
    // If not logged in, not authorized
    if (status === "unauthenticated" || !session) {
      setIsAuthorized(false)
      return
    }

    // If still loading session, wait
    if (status === "loading") {
      return
    }

    try {
      const response = await fetch("/api/authLevel")
      const data = await response.json()
      // Allow both officers and mentors
      setIsAuthorized(data.isOfficer || data.isMentor)
    } catch (error) {
      console.error("Error checking auth:", error)
      setIsAuthorized(false)
    }
  }, [session, status])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    // Redirect to homepage if not authorized
    if (isAuthorized === false) {
      router.push("/")
    }
  }, [isAuthorized, router])

  // Loading state or redirecting
  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
