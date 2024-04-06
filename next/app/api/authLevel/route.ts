import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

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
