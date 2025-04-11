import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

/**
 * HTTP PUT request to /api/authLevel/
 * Ideally this would be a GET request but the computer doesn't like it when I put data in the body of a GET.
 *
 * This route should be used to figure out what level of authorization a given user has.
 *
 * The user's session token should be provided in the request body.
 *
 * returns {
 * * isUser: boolean -- whether the provided email/token corresponds to a valid user
 * * isMember: boolean -- isUser && the user is a member
 * * isMentor: boolean -- isUser && the user is an active mentor
 * * isOfficer: boolean -- isUser && the user is an active officer
 *
 * }
 * @param request \{token: string}
 * @returns \{isUser: boolean, isMember: boolean, isMentor: boolean, isOfficer: boolean} the auth level
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  console.log("Getting Auth for ", body, user);

  const authLevel = {
    isUser: false,
    isMember: false,
    isMentor: false,
    isOfficer: false,
  };

  // if the email or token we get is null, don't call prisma
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
      // select a minimal amount of data for active mentors
      mentor: {
        where: { isActive: true },
        select: { id: true },
      },
      // select a minimal amount of data for active officers
      officers: {
        where: { is_active: true },
        select: { id: true },
      },
      isMember: true,
    },
  });
  if (user != null) {
    // deconstruct the user object
    const { mentor, officers, isMember } = user;
    if (officers.length > 0) {
      authLevel.isOfficer = true;
    }
    if (mentor.length > 0) {
      authLevel.isMentor = true;
    }
    authLevel.isMember = isMember;
    authLevel.isUser = true;
  }
  return Response.json(authLevel);
}

/**
 * HTTP GET request to /api/authLevel/
 * This route should be used to figure out what level of authorization a given user has.
 *
 * The user's email or session token should be provided in the request body.
 *
 * returns {
 * * isUser: boolean -- whether the provided email/token corresponds to a valid user
 * * isMember: boolean -- isUser && the user is a member
 * * isMentor: boolean -- isUser && the user is an active mentor
 * * isOfficer: boolean -- isUser && the user is an active officer
 *
 * }
 * @param request \{email: string} | {token: string}
 * @returns \{isUser: boolean, isMember: boolean, isMentor: boolean, isOfficer: boolean} the auth level
 */
export async function GET(request: NextRequest) {
  const authToken = request.cookies.get("next-auth.session-token")?.value;

  const authLevel = {
    isUser: false,
    isMember: false,
    isMentor: false,
    isOfficer: false,
  };
  console.log("AuthToken:", authToken);
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
      // select a minimal amount of data for active mentors
      mentor: {
        where: { isActive: true },
        select: { id: true },
      },
      // select a minimal amount of data for active officers
      officers: {
        where: { is_active: true },
        select: { id: true },
      },
      isMember: true,
    },
  });

  console.log("User found by Prisma:", user);
  if (user != null) {
    // deconstruct the user object
    const { mentor, officers, isMember } = user;
    if (officers.length > 0) {
      authLevel.isOfficer = true;
    }
    if (mentor.length > 0) {
      authLevel.isMentor = true;
    }
    authLevel.isMember = isMember;
    authLevel.isUser = true;
  }
  else {
    console.log("No user found")
  }
  return Response.json(authLevel);
}
