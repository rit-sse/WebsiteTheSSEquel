import { redirect } from "next/navigation"
import { getAuthLevel } from "@/lib/services/authLevelService"

export default async function MentoringDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authLevel = await getAuthLevel()

  // Allow any officer, mentor, or primary officer to view
  if (!authLevel.isUser || !(authLevel.isOfficer || authLevel.isMentor || authLevel.isPrimary)) {
    redirect("/dashboard/positions")
  }

  return <>{children}</>
}
