import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AcademicTerm, getCurrentAcademicTerm } from "@/lib/academicTerm";

const PROFILE_COMPLETION_REASON = "Profile completion";

export interface ProfileCompletionResult {
  membershipAwarded: boolean;
  membershipRevoked: boolean;
  awardReason?: string;
  awardTerm?: AcademicTerm;
  awardYear?: number;
}

export function isProfileCompletionEligible(user: {
  graduationTerm: AcademicTerm | null;
  graduationYear: number | null;
  major: string | null;
  gitHub: string | null;
  linkedIn: string | null;
}): boolean {
  return Boolean(
    user.graduationTerm &&
      user.graduationYear &&
      user.major?.trim() &&
      user.gitHub?.trim() &&
      user.linkedIn?.trim()
  );
}

/**
 * Grants or revokes the profile-completion membership based on current eligibility.
 *
 * - If eligible and not yet granted this term → create membership, record grant.
 * - If NOT eligible but was granted this term → delete the membership, clear grant record.
 * - Otherwise → no-op.
 */
export async function maybeGrantProfileCompletionMembership(
  tx: Prisma.TransactionClient,
  userId: number
): Promise<ProfileCompletionResult> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      graduationTerm: true,
      graduationYear: true,
      major: true,
      gitHub: true,
      linkedIn: true,
      profileCompletionGrantedTerm: true,
      profileCompletionGrantedYear: true,
    },
  });

  if (!user) {
    return { membershipAwarded: false, membershipRevoked: false };
  }

  const eligible = isProfileCompletionEligible(user);
  const current = getCurrentAcademicTerm();
  const grantedThisTerm =
    user.profileCompletionGrantedTerm === current.term &&
    user.profileCompletionGrantedYear === current.year;

  // ── Eligible: grant if not already granted this term ──
  if (eligible) {
    if (grantedThisTerm) {
      return { membershipAwarded: false, membershipRevoked: false };
    }

    await tx.memberships.create({
      data: {
        userId,
        reason: PROFILE_COMPLETION_REASON,
        dateGiven: new Date(),
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        profileCompletionGrantedTerm: current.term,
        profileCompletionGrantedYear: current.year,
      },
    });

    return {
      membershipAwarded: true,
      membershipRevoked: false,
      awardReason: PROFILE_COMPLETION_REASON,
      awardTerm: current.term,
      awardYear: current.year,
    };
  }

  // ── Not eligible: revoke if it was granted this term ──
  if (grantedThisTerm) {
    // Delete the profile-completion membership(s) for this user that were
    // created since the start of the current term.
    await tx.memberships.deleteMany({
      where: {
        userId,
        reason: PROFILE_COMPLETION_REASON,
      },
    });

    // Clear the grant tracking so it can be re-granted if they re-fill fields
    await tx.user.update({
      where: { id: userId },
      data: {
        profileCompletionGrantedTerm: null,
        profileCompletionGrantedYear: null,
      },
    });

    return { membershipAwarded: false, membershipRevoked: true };
  }

  return { membershipAwarded: false, membershipRevoked: false };
}

export async function maybeGrantProfileCompletionMembershipWithTx(userId: number) {
  return prisma.$transaction(async (tx) => maybeGrantProfileCompletionMembership(tx, userId));
}
