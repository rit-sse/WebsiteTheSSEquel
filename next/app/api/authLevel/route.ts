import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { MENTOR_HEAD_TITLE } from "@/lib/utils";

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
    isMentoringHead: boolean;
    isPrimary: boolean;
  } = {
    userId: null,
    isUser: false,
    isMember: false,
    membershipCount: 0,
    isMentor: false,
    isOfficer: false,
    isMentoringHead: false,
    isPrimary: false,
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
    authLevel.isMentor = user.mentor.length > 0;
    authLevel.isOfficer = user.officers.length > 0;
    authLevel.isMentoringHead = user.officers.some(
      (officer) => officer.position.title === MENTOR_HEAD_TITLE
    );
    authLevel.isPrimary = user.officers.some(
      (officer) => officer.position.is_primary
    );
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
    isMentoringHead: boolean;
    isPrimary: boolean;
  } = {
    userId: null,
    isUser: false,
    isMember: false,
    membershipCount: 0,
    isMentor: false,
    isOfficer: false,
    isMentoringHead: false,
    isPrimary: false,
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
    authLevel.isMentor = user.mentor.length > 0;
    authLevel.isOfficer = user.officers.length > 0;
    authLevel.isMentoringHead = user.officers.some(
      (officer) => officer.position.title === MENTOR_HEAD_TITLE
    );
    authLevel.isPrimary = user.officers.some(
      (officer) => officer.position.is_primary
    );
  }

  return Response.json(authLevel);
}
