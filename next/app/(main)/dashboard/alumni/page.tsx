import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import AlumniPageContent from "./AlumniPageContent";

export default async function AlumniReviewPage() {
  const authLevel = await getAuthLevel();

  if (!authLevel.isOfficer) {
    redirect("/dashboard/positions");
  }

  return <AlumniPageContent />;
}
