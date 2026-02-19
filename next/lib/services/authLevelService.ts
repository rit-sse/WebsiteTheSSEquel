import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuthLevel } from "@/lib/authLevel";
import { MENTOR_HEAD_TITLE, PROJECTS_HEAD_TITLE } from "@/lib/utils";

/**
 * Resolve auth level for the current user.
 * Can be called from Server Components, API routes, or anywhere on the server.
 * Uses getServerSession (no HTTP round-trip).
 */
export async function getAuthLevel(): Promise<AuthLevel> {
  const defaults: AuthLevel = {
    userId: null,
    isUser: false,
    isMember: false,
    membershipCount: 0,
    isMentor: false,
    isOfficer: false,
    isMentoringHead: false,
    isProjectsHead: false,
    isPrimary: false,
    profileComplete: true,
  };

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { ...defaults };

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
            select: { is_primary: true, title: true },
          },
        },
      },
      _count: {
        select: { Memberships: true },
      },
    },
  });

  if (!user) return { ...defaults };

  const membershipCount = user._count.Memberships;
  return {
    userId: user.id,
    isUser: true,
    membershipCount,
    isMember: membershipCount >= 1,
    isMentor: user.mentor.length > 0,
    isOfficer: user.officers.length > 0,
    isMentoringHead: user.officers.some((o) => o.position.title === MENTOR_HEAD_TITLE),
    isProjectsHead: user.officers.some((o) => o.position.title === PROJECTS_HEAD_TITLE),
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
