import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { AuthLevel } from "@/lib/authLevel";
import { hasStagingElevatedAccess } from "@/lib/proxyAuth";
import { getSessionToken } from "@/lib/sessionToken";
import { MENTOR_HEAD_TITLE, PROJECTS_HEAD_TITLE } from "@/lib/utils";

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
    isPrimary: false,
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
    authLevel.isPrimary = true;
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
  authLevel.userId = user.id;
  authLevel.isUser = true;
  authLevel.membershipCount = membershipCount;
  authLevel.isMember = membershipCount >= 1;

  if (!stagingElevated) {
    authLevel.isMentor = user.mentor.length > 0;
    authLevel.isOfficer = user.officers.length > 0;
    authLevel.isMentoringHead = user.officers.some(
      (officer) => officer.position.title === MENTOR_HEAD_TITLE
    );
    authLevel.isProjectsHead = user.officers.some(
      (officer) => officer.position.title === PROJECTS_HEAD_TITLE
    );
    authLevel.isPrimary = user.officers.some(
      (officer) => officer.position.is_primary
    );
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
