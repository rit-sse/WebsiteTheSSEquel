import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuthLevel } from "@/lib/authLevel";
import {
  MENTOR_HEAD_TITLE,
  PROJECTS_HEAD_TITLE,
  TECH_COMMITTEE_HEAD_TITLE,
  TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE,
  TECH_COMMITTEE_DIVISION_MANAGER_TITLES,
} from "@/lib/utils";
import { SE_ADMIN_POSITION_TITLE } from "@/lib/seAdmin";

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
    isTechCommitteeHead: false,
    isTechCommitteeDivisionManager: false,
    techCommitteeManagedDivision: null,
    isPrimary: false,
    isPrimaryOfficer: false,
    isSeAdmin: false,
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
  const managedDivisionOfficer = user.officers.find((o) =>
    TECH_COMMITTEE_DIVISION_MANAGER_TITLES.includes(
      o.position
        .title as (typeof TECH_COMMITTEE_DIVISION_MANAGER_TITLES)[number]
    )
  );
  return {
    userId: user.id,
    isUser: true,
    membershipCount,
    isMember: membershipCount >= 1,
    isMentor: user.mentor.length > 0,
    isOfficer: user.officers.length > 0,
    isMentoringHead: user.officers.some(
      (o) => o.position.title === MENTOR_HEAD_TITLE
    ),
    isProjectsHead: user.officers.some(
      (o) => o.position.title === PROJECTS_HEAD_TITLE
    ),
    isTechCommitteeHead: user.officers.some(
      (o) => o.position.title === TECH_COMMITTEE_HEAD_TITLE
    ),
    isTechCommitteeDivisionManager: user.officers.some((o) =>
      TECH_COMMITTEE_DIVISION_MANAGER_TITLES.includes(
        o.position
          .title as (typeof TECH_COMMITTEE_DIVISION_MANAGER_TITLES)[number]
      )
    ),
    techCommitteeManagedDivision: managedDivisionOfficer
      ? TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE[
          managedDivisionOfficer.position
            .title as keyof typeof TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE
        ]
      : null,
    isPrimary: user.officers.some((o) => o.position.is_primary),
    isPrimaryOfficer: user.officers.some((o) => o.position.is_primary),
    isSeAdmin: user.officers.some((o) => o.position.title === SE_ADMIN_POSITION_TITLE),
    profileComplete: !!(
      user.graduationTerm &&
      user.graduationYear &&
      user.major?.trim() &&
      user.gitHub?.trim() &&
      user.linkedIn?.trim()
    ),
  };
}
