import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import CommitteeHeadNominationsClient from "./CommitteeHeadNominationsClient";

export const dynamic = "force-dynamic";

export default async function CommitteeHeadNominationsPage() {
  const auth = await getAuthLevel();
  if (!auth.isPrimary) {
    redirect("/dashboard");
  }

  return <CommitteeHeadNominationsClient />;
}
