import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { serializeElectionForClient } from "@/lib/elections";
import { canManageElections, isUserCurrentPresident, isUserSeAdmin } from "@/lib/seAdmin";
import DashboardElectionsClient from "./DashboardElectionsClient";
import type { ElectionListItem } from "@/components/elections/types";

export default async function DashboardElectionsPage() {
  const authLevel = await getAuthLevel();
  if (!(await canManageElections(authLevel))) {
    redirect("/dashboard");
  }

  const [elections, primaryPositions, isPresident, isSeAdminFlag] =
    await Promise.all([
      prisma.election.findMany({
        include: {
          offices: {
            include: {
              officerPosition: {
                select: { id: true, title: true, is_primary: true },
              },
              nominations: {
                select: {
                  id: true,
                  status: true,
                  eligibilityStatus: true,
                },
              },
            },
          },
          approvals: {
            select: {
              id: true,
              stage: true,
              userId: true,
            },
          },
          ballots: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.officerPosition.findMany({
        where: { is_primary: true },
        select: { id: true, title: true, email: true },
        orderBy: { title: "asc" },
      }),
      isUserCurrentPresident(authLevel.userId),
      isUserSeAdmin(authLevel.userId),
    ]);

  return (
    <DashboardElectionsClient
      initialElections={serializeElectionForClient(elections) as unknown as ElectionListItem[]}
      primaryPositions={serializeElectionForClient(primaryPositions)}
      isPresident={isPresident}
      isSeAdmin={isSeAdminFlag}
    />
  );
}
