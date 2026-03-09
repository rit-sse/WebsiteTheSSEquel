import { redirect } from "next/navigation"
import { getAuthLevel } from "@/lib/services/authLevelService"

export default async function MentoringDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authLevel = await getAuthLevel()

  // Only allow Mentoring Head or Primary Officers
  if (!authLevel.isUser || !(authLevel.isMentoringHead || authLevel.isPrimary)) {
    redirect("/dashboard/positions")
  }

  return <>{children}</>
}
