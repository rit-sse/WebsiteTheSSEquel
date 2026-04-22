import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import {
  getElectionWithRelations,
  serializeElectionForClient,
} from "@/lib/elections";
import RunningMateAcceptClient from "./RunningMateAcceptClient";
import type {
  SerializedElection,
  SerializedNomination,
} from "@/components/elections/types";

/**
 * Dedicated VP-running-mate acceptance flow. Mirrors the regular
 * `/respond/[nominationId]` page so an emailed link can drop the VP
 * straight here. Like presidential nominees, VPs now fill out their
 * own statement / program / year / eligibility on accept.
 *
 * `nominationId` here is the PRESIDENT'S nomination id — there's no
 * standalone ElectionNomination row for the VP. The running-mate
 * invitation is resolved via that key.
 */
export default async function RespondToRunningMatePage({
  params,
}: {
  params: Promise<{ slug: string; nominationId: string }>;
}) {
  const { slug, nominationId } = await params;
  const authLevel = await getAuthLevel();
  if (!authLevel.userId) {
    redirect(
      `/login?callbackUrl=/elections/${slug}/respond/running-mate/${nominationId}`
    );
  }

  const election = await getElectionWithRelations({ slug });
  if (!election) {
    redirect("/elections");
  }

  const serializedElection = serializeElectionForClient(
    election
  ) as unknown as SerializedElection;

  const nominationIdNum = Number(nominationId);
  let presidentNomination: SerializedNomination | null = null;
  for (const office of serializedElection.offices) {
    const match = office.nominations.find((n) => n.id === nominationIdNum);
    if (match) {
      presidentNomination = match;
      break;
    }
  }

  const invitation = presidentNomination?.runningMateInvitation;
  if (!presidentNomination || !invitation) {
    // No invite at this URL — bounce.
    redirect(`/elections/${slug}`);
  }
  if (invitation.inviteeUserId !== authLevel.userId) {
    // Don't leak invitations addressed to other users.
    redirect(`/elections/${slug}`);
  }

  return (
    <RunningMateAcceptClient
      electionId={serializedElection.id}
      electionSlug={serializedElection.slug}
      electionTitle={serializedElection.title}
      presidentNomination={presidentNomination}
      invitation={invitation}
      // Use the invitation's own TTL (~22h) rather than the election's
      // votingOpenAt — the API enforces `expiresAt` exactly and bumps
      // declined/expired invitations to the EXPIRED state.
      responseDeadline={invitation.expiresAt}
    />
  );
}
