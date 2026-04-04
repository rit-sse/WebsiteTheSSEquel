import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import {
  getElectionWithRelations,
  serializeElectionForClient,
  tallyInstantRunoffElection,
  shouldUsePresidentOnlyBallot,
} from "@/lib/elections";
import { canManageElections } from "@/lib/seAdmin";
import ElectionResultsClient from "./ElectionResultsClient";
import type { SerializedElection } from "@/components/elections/types";
import type { IRVOfficeResult, IRVRound } from "@/components/elections/types";

export default async function ElectionResultsPage({
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
  const isAdmin = await canManageElections(authLevel);

  const isCertified = election.status === "CERTIFIED";
  const isVotingClosed = election.status === "VOTING_CLOSED";
  const canViewResults = isCertified || (isVotingClosed && isAdmin);

  const serialized = serializeElectionForClient(election) as unknown as SerializedElection;

  if (!canViewResults) {
    return (
      <ElectionResultsClient
        election={serialized}
        results={[]}
        canView={false}
      />
    );
  }

  /* ---- Build nominee lookup from all offices ---- */
  const nomineeNames = new Map<number, string>();
  for (const office of election.offices) {
    for (const nomination of office.nominations) {
      nomineeNames.set(nomination.id, nomination.nominee.name);
    }
  }

  /* ---- Determine if president-only ballot applies ---- */
  const presidentOnlyBallot = shouldUsePresidentOnlyBallot(election);

  /* ---- Tally each office ---- */
  const officesToTally = election.offices.filter(
    (office) =>
      !(presidentOnlyBallot && office.officerPosition.title === "Vice President")
  );

  const rawResults = officesToTally.map((office) =>
    tallyInstantRunoffElection({
      office,
      ballots: election.ballots.map((ballot) => ({
        rankings: ballot.rankings.map((ranking) => ({
          electionOfficeId: ranking.electionOfficeId,
          nominationId: ranking.nominationId,
          rank: ranking.rank,
        })),
      })),
    })
  );

  /* ---- Handle president-only VP result ---- */
  if (presidentOnlyBallot) {
    const presidentResult = rawResults.find((r) => r.officeTitle === "President");
    const vpOffice = election.offices.find(
      (o) => o.officerPosition.title === "Vice President"
    );
    if (presidentResult && vpOffice) {
      rawResults.push({
        officeId: vpOffice.id,
        officeTitle: "Vice President",
        status: presidentResult.status,
        winner: presidentResult.runnerUp,
        runnerUp: null,
        rounds: presidentResult.rounds,
      } as (typeof rawResults)[number]);
    }
  }

  /* ---- Transform raw tally results into client-friendly IRVOfficeResult[] ---- */
  const totalBallots = election.ballots.length;

  const results: IRVOfficeResult[] = rawResults.map((raw) => {
    const rounds: IRVRound[] = raw.rounds.map((round, index) => ({
      roundNumber: index + 1,
      counts: round.counts.map((entry) => ({
        nominationId: entry.nominationId,
        candidateName: nomineeNames.get(entry.nominationId) ?? "Unknown",
        votes: entry.votes,
        eliminated: entry.nominationId === round.eliminatedNominationId,
      })),
      eliminatedNominationId: round.eliminatedNominationId ?? null,
    }));

    /* ---- Determine final vote count for winner/runner-up ---- */
    const lastRound = rounds[rounds.length - 1];
    const winnerFinalVotes =
      raw.winner && lastRound
        ? lastRound.counts.find((c) => c.nominationId === raw.winner!.id)
            ?.votes ?? 0
        : 0;

    const runnerUpFinalVotes =
      raw.runnerUp && lastRound
        ? lastRound.counts.find((c) => c.nominationId === raw.runnerUp!.id)
            ?.votes ?? 0
        : 0;

    return {
      officeId: raw.officeId,
      officeTitle: raw.officeTitle,
      status: raw.status,
      winner: raw.winner
        ? {
            nominationId: raw.winner.id,
            name: raw.winner.nominee.name,
            finalVotes: winnerFinalVotes,
          }
        : null,
      runnerUp: raw.runnerUp
        ? {
            nominationId: raw.runnerUp.id,
            name: raw.runnerUp.nominee.name,
            finalVotes: runnerUpFinalVotes,
          }
        : null,
      rounds,
      totalBallots,
    };
  });

  return (
    <ElectionResultsClient
      election={serialized}
      results={results}
      canView={true}
    />
  );
}
