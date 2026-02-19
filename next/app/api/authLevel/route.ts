import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { MENTOR_HEAD_TITLE, PROJECTS_HEAD_TITLE } from "@/lib/utils";
import { getProxyEmail, hasStagingElevatedAccess } from "@/lib/proxyAuth";
import { AuthLevel } from "@/lib/authLevel";

export const dynamic = 'force-dynamic'

async function applyStagingProxyAccess(request: Request, authLevel: AuthLevel): Promise<boolean> {
  if (!hasStagingElevatedAccess(request)) {
    return false;
  }

  const proxyEmail = getProxyEmail(request);
  const user = proxyEmail
    ? await prisma.user.findFirst({
        where: { email: { equals: proxyEmail, mode: "insensitive" } },
        select: { id: true, _count: { select: { Memberships: true } } },
      })
    : null;

  authLevel.userId = user?.id ?? null;
  authLevel.isUser = !!proxyEmail;
  authLevel.membershipCount = user?._count.Memberships ?? 0;
  authLevel.isMember = authLevel.membershipCount >= 1;
  authLevel.isMentor = true;
  authLevel.isOfficer = true;
  authLevel.isMentoringHead = true;
  authLevel.isProjectsHead = true;
  authLevel.isPrimary = true;

  return true;
}

/**
 * Handles a PUT request to update or retrieve authorization level details for a user.
 * Processes the incoming request, validates the JSON body, and determines the user's
 * authorization level based on the provided token.
 *
 * @param {Request} request - The HTTP request object containing the details of the PUT request.
 * @return {Promise<Response>} A Promise resolving to an HTTP Response object containing the
 *                             authorization level or an error message if the JSON body is invalid.
 */
export async function PUT(request: Request): Promise<Response> {
  console.log("[authLevel][PUT] staging proxy debug", {
    stagingEnabled: process.env.STAGING_PROXY_AUTH,
    proxyEmail: request.headers.get("x-auth-request-email"),
    proxyGroups: request.headers.get("x-auth-request-groups"),
  });

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const authLevel: AuthLevel = {
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

  const hasStagingAccess = await applyStagingProxyAccess(request, authLevel);

  if (body.token == null) {
    return Response.json(authLevel);
  }

  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken: body.token,
        },
      },
    },
    select: {
      id: true,
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

  if (user != null) {
    const membershipCount = user._count.Memberships;
    authLevel.userId = user.id;
    authLevel.isUser = true;
    authLevel.membershipCount = membershipCount;
    authLevel.isMember = membershipCount >= 1;
    if (!hasStagingAccess) {
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
  }

  return Response.json(authLevel);
}

/**
 * HTTP GET request to /api/authLevel/
 */
export async function GET(request: NextRequest) {
  console.log("[authLevel][GET] staging proxy debug", {
    stagingEnabled: process.env.STAGING_PROXY_AUTH,
    proxyEmail: request.headers.get("x-auth-request-email"),
    proxyGroups: request.headers.get("x-auth-request-groups"),
  });

  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

  const authLevel: AuthLevel = {
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

  const hasStagingAccess = await applyStagingProxyAccess(request, authLevel);

  if (authToken == null) {
    return Response.json(authLevel);
  }

  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken: authToken,
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

  if (user != null) {
    const membershipCount = user._count.Memberships;
    authLevel.userId = user.id;
    authLevel.isUser = true;
    authLevel.membershipCount = membershipCount;
    authLevel.isMember = membershipCount >= 1;
    if (!hasStagingAccess) {
      authLevel.isMentor = user.mentor.length > 0;
      authLevel.isOfficer = user.officers.length > 0;
      authLevel.isMentoringHead = user.officers.some(
        (officer) => officer.position.title === MENTOR_HEAD_TITLE
      );
      authLevel.isProjectsHead = user.officers.some(
        (officer) => officer.position.title === PROJECTS_HEAD_TITLE
      );
      authLevel.isPrimary = user.officers.some((officer) => officer.position.is_primary);
    }
    authLevel.profileComplete = !!(
      user.graduationTerm &&
      user.graduationYear &&
      user.major?.trim() &&
      user.gitHub?.trim() &&
      user.linkedIn?.trim()
    );
  }

  return Response.json(authLevel);
}
