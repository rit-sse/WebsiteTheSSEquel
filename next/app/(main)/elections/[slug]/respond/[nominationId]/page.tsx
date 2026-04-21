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

  // Serialize up-front so every user reference (nominee, nominator,
  // running mate) already has its `image` URL resolved via the
  // shared image-resolution pipeline. The live preview + nominator
  // chip rely on `nominee.image` / `nominator.image` being populated.
  const serializedElection = serializeElectionForClient(
    election
  ) as unknown as SerializedElection;

  // Find the nomination across offices.
  const nominationIdNum = Number(nominationId);
  let nomination: SerializedNomination | null = null;
  let officeTitle: string | null = null;
  let nominators: {
    id: number;
    name: string;
    image: string | null;
  }[] = [];
  for (const office of serializedElection.offices) {
    const match = office.nominations.find((n) => n.id === nominationIdNum);
    if (match) {
      nomination = match;
      officeTitle = office.officerPosition.title;
      // Each (office, nominee) pair is a single row in the current
      // schema, so the single nominator is sufficient. Image is
      // already resolved by the serializer.
      nominators = [
        {
          id: match.nominator.id,
          name: match.nominator.name,
          image: match.nominator.image ?? null,
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
