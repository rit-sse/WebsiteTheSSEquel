import { getAuthLevel } from "@/lib/services/authLevelService";
import {
  getElectionWithRelations,
  serializeElectionForClient,
  toPublicElectionView,
} from "@/lib/elections";
import { isActiveMemberForElection } from "@/lib/electionEligibility";
import { isUserCurrentPresident } from "@/lib/seAdmin";
import { redirect } from "next/navigation";
import ElectionPublicClient from "../ElectionPublicClient";
import type {
  PublicElection,
  SerializedElection,
} from "@/components/elections/types";

export default async function ElectionPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const election = await getElectionWithRelations({ slug });
  if (!election) {
    redirect("/elections");
  }

  const authLevel = await getAuthLevel();
  const canNominate = authLevel.userId
    ? await isActiveMemberForElection(authLevel.userId)
    : false;
  const isPresident = await isUserCurrentPresident(authLevel.userId);

  return (
    <ElectionPublicClient
      // Page props are embedded in the HTML, so never send ballots or emails.
      election={toPublicElectionView(
        serializeElectionForClient(election) as unknown as SerializedElection,
        authLevel.userId
      )}
      currentUserId={authLevel.userId}
      canNominate={canNominate}
      isMember={authLevel.isMember}
      isPrimary={authLevel.isPrimary}
      isSeAdmin={authLevel.isSeAdmin}
      isPresident={isPresident}
    />
  );
}
