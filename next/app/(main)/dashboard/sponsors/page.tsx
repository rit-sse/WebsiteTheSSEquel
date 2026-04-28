import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import SponsorsPageContent from "./SponsorsPageContent";

export default async function SponsorsPage() {
  const authLevel = await getAuthLevel();

  if (!authLevel.isOfficer) {
    redirect("/dashboard/positions");
  }

  return <SponsorsPageContent />;
}
