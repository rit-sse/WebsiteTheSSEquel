import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { getSessionToken } from "@/lib/sessionToken";
import { resolveUserImage } from "@/lib/s3Utils";
import { NextRequest } from "next/server";

type Actor = {
  id: number;
  email: string;
  isMember: boolean;
  isPrimary: boolean;
  isSeAdmin: boolean;
  isOfficer: boolean;
  membershipCount: number;
};

type AmendmentVoteRow = {
  id: number;
  amendmentId: number;
  userId: number;
  approve: boolean;
};

type AmendmentVoteSummary = {
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
};

function toAuthHeaders(request: NextRequest) {
  const token = getSessionToken(request);
  return token ?? null;
}

async function resolveActorFromToken(sessionToken: string | null): Promise<Actor | null> {
  if (!sessionToken) return null;

  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken,
        },
      },
    },
    select: {
      id: true,
      email: true,
      _count: {
        select: {
          Memberships: true,
        },
      },
      officers: {
        where: { is_active: true },
        select: {
          position: {
            select: {
              is_primary: true,
              title: true,
              category: true,
            },
          },
        },
      },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    membershipCount: user._count.Memberships,
    isMember: user._count.Memberships >= 1,
    isOfficer: user.officers.length > 0,
    isPrimary: user.officers.some((officer) => officer.position.is_primary),
    // Any active SE Office position grants the same amendment-management
    // privileges, not just the literal "SE Admin" title (which doesn't
    // exist in the seeded position list anymore).
    isSeAdmin: user.officers.some(
      (officer) => officer.position.category === "SE_OFFICE"
    ),
  };
}

export async function getActorFromRequest(request: NextRequest): Promise<Actor | null> {
  const sessionToken = toAuthHeaders(request);
  return resolveActorFromToken(sessionToken);
}

export async function getActiveMemberCount(): Promise<number> {
  return prisma.user.count({
    where: {
      Memberships: {
        some: {},
      },
    },
  });
}

export function computeVoteSummary(votes: Pick<AmendmentVoteRow, "approve">[]): AmendmentVoteSummary {
  const totalVotes = votes.length;
  const approveVotes = votes.reduce((acc, vote) => (vote.approve ? acc + 1 : acc), 0);
  return {
    totalVotes,
    approveVotes,
    rejectVotes: totalVotes - approveVotes,
  };
}

export function getAmendmentStatusTransitions() {
  return {
    DRAFT: ["PRIMARY_REVIEW", "WITHDRAWN"],
    OPEN: ["PRIMARY_REVIEW", "WITHDRAWN"],
    PRIMARY_REVIEW: ["VOTING", "REJECTED", "WITHDRAWN"],
    VOTING: ["APPROVED", "REJECTED", "WITHDRAWN"],
    APPROVED: ["MERGED", "WITHDRAWN"],
    REJECTED: [],
    MERGED: [],
    WITHDRAWN: [],
  } as Record<AmendmentStatus, AmendmentStatus[]>;
}

export async function getActivePrimaryOfficerCount(): Promise<number> {
  return prisma.officer.count({
    where: {
      is_active: true,
      position: {
        is_primary: true,
      },
    },
  });
}

export function computePrimaryReviewQuorum(primaryCount: number): number {
  if (primaryCount === 0) return 0;
  return Math.floor(primaryCount / 2) + 1; // strict majority
}

export function computePrimaryReviewResult(
  votes: Pick<{ approve: boolean }, "approve">[],
  totalPrimaries: number,
) {
  const totalVoted = votes.length;
  const approveVotes = votes.filter((v) => v.approve).length;
  const rejectVotes = totalVoted - approveVotes;
  const quorumRequired = computePrimaryReviewQuorum(totalPrimaries);
  const quorumMet = totalVoted >= quorumRequired;

  return {
    totalVoted,
    approveVotes,
    rejectVotes,
    quorumRequired,
    quorumMet,
    majorityApproves: quorumMet && approveVotes > rejectVotes,
    majorityRejects: quorumMet && rejectVotes >= approveVotes,
  };
}

export function resolveAmendmentImage(user: {
  profileImageKey?: string | null;
  googleImageURL?: string | null;
}): string {
  return resolveUserImage(user.profileImageKey, user.googleImageURL) ?? "";
}
