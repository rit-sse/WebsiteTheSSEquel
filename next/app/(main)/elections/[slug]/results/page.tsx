import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import {
  serializeElectionForClient,
  tallyElectionForDisplay,
  toPublicElectionView,
} from "@/lib/elections";
import { canManageElections } from "@/lib/seAdmin";
import ElectionResultsClient from "./ElectionResultsClient";
import type {
  IRVOfficeResult,
  SerializedElection,
} from "@/components/elections/types";

export default async function ElectionResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tallied = await tallyElectionForDisplay(slug);

  if (!tallied) {
    redirect("/elections");
  }

  const { election, results } = tallied;

  const authLevel = await getAuthLevel();
  const isAdmin = await canManageElections(authLevel);

  const isCertified = election.status === "CERTIFIED";
  const isVotingClosed = election.status === "VOTING_CLOSED";
  const canViewResults = isCertified || (isVotingClosed && isAdmin);

  // Results are aggregate tallies; individual ballots never reach the page.
  const serialized = toPublicElectionView(
    serializeElectionForClient(election) as unknown as SerializedElection,
    authLevel.userId
  );

  if (!canViewResults) {
    return (
      <ElectionResultsClient
        election={serialized}
        results={[]}
        canView={false}
        canCertify={false}
      />
    );
  }

  // The SE Office certifies — offer the CTA when voting is closed but the
  // election isn't certified yet.
  const canCertify = isVotingClosed && isAdmin;

  return (
    <ElectionResultsClient
      election={serialized}
      results={results as unknown as IRVOfficeResult[]}
      canView={true}
      canCertify={canCertify}
    />
  );
}
