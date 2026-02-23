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
  };
}

export async function getActorFromRequest(request: NextRequest): Promise<Actor | null> {
  const sessionToken = toAuthHeaders(request);
  return resolveActorFromToken(sessionToken);
}

export async function getActiveMemberCount(): Promise<number> {
  return prisma.user.count({
    where: {
      memberships: {
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
    DRAFT: ["OPEN", "WITHDRAWN"],
    OPEN: ["VOTING", "WITHDRAWN"],
    VOTING: ["APPROVED", "REJECTED", "WITHDRAWN"],
    APPROVED: ["MERGED", "WITHDRAWN"],
    REJECTED: [],
    MERGED: [],
    WITHDRAWN: [],
  } as Record<AmendmentStatus, AmendmentStatus[]>;
}

export function resolveAmendmentImage(user: {
  profileImageKey?: string | null;
  googleImageURL?: string | null;
}): string {
  return resolveUserImage(user.profileImageKey, user.googleImageURL);
}
