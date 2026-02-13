import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export interface AuthLevel {
  userId: number | null;
  isUser: boolean;
  isMember: boolean;
  membershipCount: number;
  isMentor: boolean;
  isOfficer: boolean;
  isPrimary: boolean;
  profileComplete: boolean;
}

const DEFAULTS: AuthLevel = {
  userId: null,
  isUser: false,
  isMember: false,
  membershipCount: 0,
  isMentor: false,
  isOfficer: false,
  isPrimary: false,
  profileComplete: true,
};

/**
 * Resolve auth level for the current user.
 * Can be called from Server Components, API routes, or anywhere on the server.
 * Uses getServerSession (no HTTP round-trip).
 */
export async function getAuthLevel(): Promise<AuthLevel> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { ...DEFAULTS };

  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      graduationTerm: true,
      graduationYear: true,
      major: true,
      gitHub: true,
      linkedIn: true,
      mentor: {
        where: { isActive: true },
        select: { id: true },
      },
      officers: {
        where: { is_active: true },
        select: {
          id: true,
          position: {
            select: { is_primary: true },
          },
        },
      },
      _count: {
        select: { Memberships: true },
      },
    },
  });

  if (!user) return { ...DEFAULTS };

  const membershipCount = user._count.Memberships;
  return {
    userId: user.id,
    isUser: true,
    membershipCount,
    isMember: membershipCount >= 1,
    isMentor: user.mentor.length > 0,
    isOfficer: user.officers.length > 0,
    isPrimary: user.officers.some((o) => o.position.is_primary),
    profileComplete: !!(
      user.graduationTerm &&
      user.graduationYear &&
      user.major?.trim() &&
      user.gitHub?.trim() &&
      user.linkedIn?.trim()
    ),
  };
}
