import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getElectionWithRelations, serializeElectionForClient } from "@/lib/elections";
import NomineeAcceptClient from "./NomineeAcceptClient";
import type {
  SerializedElection,
  SerializedNomination,
} from "@/components/elections/types";

/**
 * Dedicated nominee-acceptance flow — split off from the main election
 * page so an emailed link can go straight here. Shows a celebratory
 * "The SSE thinks you'd make a GREAT <TITLE>" headline (with dancing
 * letters on the office title), an eligibility check, then the accept /
 * decline gate. After accepting, presidents get the VP running-mate
 * invite step; everyone then fills in bio + photo + platform.
 */
export default async function RespondToNominationPage({
  params,
}: {
  params: Promise<{ slug: string; nominationId: string }>;
}) {
  const { slug, nominationId } = await params;
  const authLevel = await getAuthLevel();
  if (!authLevel.userId) {
    redirect(`/login?callbackUrl=/elections/${slug}/respond/${nominationId}`);
  }

  const election = await getElectionWithRelations({ slug });
  if (!election) {
    redirect("/elections");
  }

  // Find the nomination across offices.
  const nominationIdNum = Number(nominationId);
  let nomination: SerializedNomination | null = null;
  let officeTitle: string | null = null;
  let nominators: { id: number; name: string }[] = [];
  for (const office of election.offices) {
    const match = office.nominations.find((n) => n.id === nominationIdNum);
    if (match) {
      nomination = match as unknown as SerializedNomination;
      officeTitle = office.officerPosition.title;
      // Pull every nomination row pointing at this nominee across this
      // office so we can show "nominated by X, Y, Z" — in the current
      // schema each (office, nominee) pair is a single row so we rely
      // on the single nominator. Pre-compute it here so the client has
      // ready data.
      nominators = [
        {
          id: match.nominator.id,
          name: match.nominator.name,
        },
      ];
      break;
    }
  }

  if (!nomination || !officeTitle) {
    redirect(`/elections/${slug}`);
  }
  if (nomination.nomineeUserId !== authLevel.userId) {
    // Don't leak other people's nominations — bounce to the election.
    redirect(`/elections/${slug}`);
  }

  const serializedElection = serializeElectionForClient(
    election
  ) as unknown as SerializedElection;

  return (
    <NomineeAcceptClient
      electionId={serializedElection.id}
      electionSlug={serializedElection.slug}
      electionTitle={serializedElection.title}
      officeTitle={officeTitle}
      nomination={nomination}
      nominators={nominators}
      responseDeadline={serializedElection.votingOpenAt}
    />
  );
}
