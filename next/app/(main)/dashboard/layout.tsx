import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { DashboardAuthProvider } from "./DashboardAuthProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authLevel = await getAuthLevel();

  // Must be signed in and be either an officer or a mentor
  if (
    !authLevel.isUser ||
    !(authLevel.isOfficer || authLevel.isMentor || authLevel.isSeAdmin)
  ) {
    redirect("/");
  }

  return (
    <DashboardAuthProvider
      isOfficer={authLevel.isOfficer}
      isMentor={authLevel.isMentor}
      isPrimary={authLevel.isPrimary}
      isMentoringHead={authLevel.isMentoringHead}
      isSeAdmin={authLevel.isSeAdmin}
    >
      {children}
    </DashboardAuthProvider>
  );
}
