import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import {
  getElectionWithRelations,
  serializeElectionForClient,
} from "@/lib/elections";
import {
  isUserCurrentPresident,
  isUserSeAdmin,
  getElectionApprovalRole,
} from "@/lib/seAdmin";
import ElectionAdminDetailClient from "./ElectionAdminDetailClient";
import type { SerializedElection } from "@/components/elections/types";

export default async function ElectionDashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authLevel = await getAuthLevel();
  // Only primaries (or SE admins, via the stagingElevated path) can view
  // the admin detail. Everyone else bounces to the home page.
  if (!authLevel.isPrimary) {
    redirect("/");
  }

  const { id } = await params;
  const [election, isPresident, isSeAdminFlag, approvalRole] =
    await Promise.all([
      getElectionWithRelations({ id: Number(id) }),
      isUserCurrentPresident(authLevel.userId),
      isUserSeAdmin(authLevel.userId),
      getElectionApprovalRole(authLevel),
    ]);

  if (!election) {
    redirect("/dashboard/elections");
  }

  return (
    <ElectionAdminDetailClient
      initialElection={serializeElectionForClient(election) as unknown as SerializedElection}
      currentUserId={authLevel.userId}
      isPresident={isPresident}
      isSeAdmin={isSeAdminFlag}
      approvalRole={approvalRole}
    />
  );
}
