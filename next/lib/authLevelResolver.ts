import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { AuthLevel } from "@/lib/authLevel";
import { hasStagingElevatedAccess } from "@/lib/proxyAuth";
import { getSessionToken } from "@/lib/sessionToken";
import {
  MENTOR_HEAD_TITLE,
  PROJECTS_HEAD_TITLE,
  TECH_COMMITTEE_HEAD_TITLE,
  TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE,
  TECH_COMMITTEE_DIVISION_MANAGER_TITLES,
} from "@/lib/utils";

type ResolveOptions = {
  includeProfileComplete?: boolean;
  stagingElevated?: boolean;
};

function getDefaultAuthLevel(includeProfileComplete: boolean): AuthLevel {
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
  };

  if (includeProfileComplete) {
    defaults.profileComplete = true;
  }

  return defaults;
}

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const cookieMap = new Map<string, string>();
  if (!cookieHeader) return cookieMap;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    cookieMap.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }

  return cookieMap;
}

export function getSessionTokenFromRequest(request: Request): string | null {
  if ("cookies" in request) {
    return getSessionToken(request as NextRequest) ?? null;
  }

  const cookieMap = parseCookieHeader(request.headers.get("cookie"));
  const cookieNames = [
    process.env.SESSION_COOKIE_NAME,
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ].filter((name): name is string => !!name);

  for (const cookieName of cookieNames) {
    const value = cookieMap.get(cookieName);
    if (value) return value;
  }

  return null;
}

export async function resolveAuthLevelFromToken(
  token: string | null,
  options: ResolveOptions = {}
): Promise<AuthLevel> {
  const includeProfileComplete = options.includeProfileComplete ?? false;
  const stagingElevated = options.stagingElevated ?? false;
  const authLevel = getDefaultAuthLevel(includeProfileComplete);

  if (stagingElevated) {
    authLevel.isMentor = true;
    authLevel.isOfficer = true;
    authLevel.isMentoringHead = true;
    authLevel.isProjectsHead = true;
    authLevel.isTechCommitteeHead = true;
    authLevel.isTechCommitteeDivisionManager = true;
    authLevel.techCommitteeManagedDivision = "Lab Division";
    authLevel.isPrimary = true;
    authLevel.isSeAdmin = true;
  }

  if (!token) {
    return authLevel;
  }

  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken: token,
        },
      },
    },
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
            select: {
              title: true,
              is_primary: true,
              category: true,
            },
          },
        },
      },
      _count: {
        select: { Memberships: true },
      },
    },
  });

  if (!user) {
    return authLevel;
  }

  const membershipCount = user._count.Memberships;
  // "SE Admin" historically meant the literal `title = "SE Admin"`
  // position, but per the SE Office every position in the SE Office
  // category (Administrative Assistant / Dean / SE Office Head /
  // Undergraduate Dean) should grant the same elevated access. Check
  // the category so all four roles count.
  const isSeAdmin = user.officers.some(
    (officer) => officer.position.category === "SE_OFFICE"
  );
  authLevel.userId = user.id;
  authLevel.isUser = true;
  authLevel.membershipCount = membershipCount;
  authLevel.isMember = membershipCount >= 1;

  // `isPrimaryOfficer` is ALWAYS the ground-truth DB state and is NOT
  // affected by staging elevation. Use this (not `isPrimary`) when the
  // UI must reflect the user's real-world role even on ssedev.
  authLevel.isPrimaryOfficer = user.officers.some(
    (officer) => officer.position.is_primary
  );

  // NOTE: `isSeAdmin` is intentionally NOT assigned here. When
  // `stagingElevated` is true we want the top-of-function `true` default
  // (lines 85-95) to survive so dev tools gated on `isSeAdmin` still
  // work under STAGING_PROXY_AUTH. Outside staging it's assigned below
  // inside the `!stagingElevated` branch.

  if (!stagingElevated) {
    authLevel.isMentor = isSeAdmin || user.mentor.length > 0;
    authLevel.isOfficer = isSeAdmin || user.officers.length > 0;
    authLevel.isMentoringHead = isSeAdmin || user.officers.some(
      (officer) => officer.position.title === MENTOR_HEAD_TITLE
    );
    authLevel.isProjectsHead = isSeAdmin || user.officers.some(
      (officer) => officer.position.title === PROJECTS_HEAD_TITLE
    );
    authLevel.isTechCommitteeHead = isSeAdmin || user.officers.some(
      (officer) => officer.position.title === TECH_COMMITTEE_HEAD_TITLE
    );
    authLevel.isTechCommitteeDivisionManager =
      isSeAdmin ||
      user.officers.some((officer) =>
      TECH_COMMITTEE_DIVISION_MANAGER_TITLES.includes(
        officer.position
          .title as (typeof TECH_COMMITTEE_DIVISION_MANAGER_TITLES)[number]
      )
    );
    const managedDivisionOfficer = user.officers.find((officer) =>
      TECH_COMMITTEE_DIVISION_MANAGER_TITLES.includes(
        officer.position
          .title as (typeof TECH_COMMITTEE_DIVISION_MANAGER_TITLES)[number]
      )
    );
    authLevel.techCommitteeManagedDivision = managedDivisionOfficer
      ? TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE[
          managedDivisionOfficer.position
            .title as keyof typeof TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE
        ]
      : null;
    authLevel.isPrimary = isSeAdmin || user.officers.some(
      (officer) => officer.position.is_primary
    );
    authLevel.isSeAdmin = isSeAdmin;
  }

  if (includeProfileComplete) {
    authLevel.profileComplete = !!(
      user.graduationTerm &&
      user.graduationYear &&
      user.major?.trim() &&
      user.gitHub?.trim() &&
      user.linkedIn?.trim()
    );
  }

  return authLevel;
}

export async function resolveAuthLevelFromRequest(
  request: Request,
  options: Omit<ResolveOptions, "stagingElevated"> = {}
): Promise<AuthLevel> {
  const token = getSessionTokenFromRequest(request);
  const stagingElevated = hasStagingElevatedAccess(request);
  return resolveAuthLevelFromToken(token, {
    includeProfileComplete: options.includeProfileComplete,
    stagingElevated,
  });
}
