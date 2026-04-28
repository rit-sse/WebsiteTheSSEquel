import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import UsersPageContent from "./UsersPageContent";

export default async function UsersPage() {
  const authLevel = await getAuthLevel();

  if (!authLevel.isOfficer) {
    redirect("/dashboard/positions");
  }

  return <UsersPageContent />;
}
