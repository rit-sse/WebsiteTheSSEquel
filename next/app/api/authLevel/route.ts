import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

/**
 * HTTP PUT request to /api/authLevel/
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const authLevel: {
    userId: number | null;
    isUser: boolean;
    isMember: boolean;
    membershipCount: number;
    isMentor: boolean;
    isOfficer: boolean;
  } = {
    userId: null,
    isUser: false,
    isMember: false,
    membershipCount: 0,
    isMentor: false,
    isOfficer: false,
  };

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
        select: { id: true },
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
    authLevel.isMentor = user.mentor.length > 0;
    authLevel.isOfficer = user.officers.length > 0;
  }

  return Response.json(authLevel);
}

/**
 * HTTP GET request to /api/authLevel/
 */
export async function GET(request: NextRequest) {
  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

  const authLevel: {
    userId: number | null;
    isUser: boolean;
    isMember: boolean;
    membershipCount: number;
    isMentor: boolean;
    isOfficer: boolean;
    isPrimary: boolean;
    profileComplete: boolean;
  } = {
    userId: null,
    isUser: false,
    isMember: false,
    membershipCount: 0,
    isMentor: false,
    isOfficer: false,
    isPrimary: false,
    profileComplete: true,
  };

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
            select: { is_primary: true },
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
    authLevel.isMentor = user.mentor.length > 0;
    authLevel.isOfficer = user.officers.length > 0;
    authLevel.isPrimary = user.officers.some((o) => o.position.is_primary);
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
