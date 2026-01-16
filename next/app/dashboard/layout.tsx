"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOfficer, setIsOfficer] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Redirect to homepage if not authorized
    if (isOfficer === false) {
      router.push("/")
    }
  }, [isOfficer, router])

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

  // Loading state or redirecting
  if (isOfficer === null || isOfficer === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
