import prisma from "@/lib/prisma";

/**
 * The candidate-profile fields a user fills in once they accept a
 * nomination (or running-mate invitation). These columns live on both
 * `ElectionNomination` and `ElectionRunningMateInvitation` — same shape
 * in both places so the propagation helper below can mirror them across
 * the user's other rows in the same election.
 */
export interface CandidateProfile {
  statement: string;
  yearLevel: number | null;
  program: string | null;
  canRemainEnrolledFullYear: boolean | null;
  canRemainEnrolledNextTerm: boolean | null;
  isOnCampus: boolean | null;
  isOnCoop: boolean | null;
}

interface PropagateOptions {
  /**
   * Skip this `ElectionNomination` id (the caller has already updated
   * it directly). Pass when triggering propagation from the regular
   * nominee respond endpoint.
   */
  excludeNominationId?: number;
  /**
   * Skip this `ElectionRunningMateInvitation` id (the caller has
   * already updated it directly). Pass when triggering propagation
   * from the running-mate respond endpoint.
   */
  excludeRunningMateInvitationId?: number;
}

/**
 * Mirror a candidate's profile fields across every other open
 * nomination + running-mate invitation they hold in this election.
 *
 * Why: the same person frequently runs for multiple offices in the
 * same cycle (e.g. Sam for Treasurer + Secretary, or a presidential
 * nominee who's also someone's VP invitee). Without this sync, each
 * row holds its own copy of statement / program / year / eligibility,
 * so a candidate has to rewrite their bio every time they accept a
 * different nomination — and the public page renders them with
 * different blurbs per office, which looks broken.
 *
 * Only propagates to rows that are still open:
 *   - ElectionNomination: PENDING_RESPONSE or ACCEPTED
 *   - ElectionRunningMateInvitation: INVITED or ACCEPTED
 *
 * Declined / expired / withdrawn rows are intentionally left alone —
 * they're closed records and shouldn't change after the fact.
 *
 * Returns the number of mirrored rows so callers can log the side
 * effect if useful.
 */
export async function propagateCandidateProfile(
  electionId: number,
  userId: number,
  profile: CandidateProfile,
  options: PropagateOptions = {}
): Promise<{ nominationsUpdated: number; invitationsUpdated: number }> {
  const { excludeNominationId, excludeRunningMateInvitationId } = options;

  const [nominationsResult, invitationsResult] = await Promise.all([
    prisma.electionNomination.updateMany({
      where: {
        nomineeUserId: userId,
        status: { in: ["PENDING_RESPONSE", "ACCEPTED"] },
        electionOffice: { electionId },
        ...(excludeNominationId !== undefined && {
          id: { not: excludeNominationId },
        }),
      },
      data: profile,
    }),
    prisma.electionRunningMateInvitation.updateMany({
      where: {
        inviteeUserId: userId,
        status: { in: ["INVITED", "ACCEPTED"] },
        presidentNomination: { electionOffice: { electionId } },
        ...(excludeRunningMateInvitationId !== undefined && {
          id: { not: excludeRunningMateInvitationId },
        }),
      },
      data: profile,
    }),
  ]);

  return {
    nominationsUpdated: nominationsResult.count,
    invitationsUpdated: invitationsResult.count,
  };
}
