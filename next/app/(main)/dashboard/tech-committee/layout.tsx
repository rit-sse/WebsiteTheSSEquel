import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";

export default async function TechCommitteeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authLevel = await getAuthLevel();

  if (
    !authLevel.isUser ||
    !(
      authLevel.isTechCommitteeHead ||
      authLevel.isPrimary ||
      authLevel.isTechCommitteeDivisionManager
    )
  ) {
    redirect("/dashboard/positions");
  }

  return <>{children}</>;
}
