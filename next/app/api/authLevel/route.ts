import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/authLevel/
 * "None" => user does not exist
 * "User" => user exists but has no other credentials
 * "Member" => user is an SSE member but has no other credentials
 * "Mentor" => user is a mentor but not an officer
 * "Officer" => user is an officer
 * @param request \{email: string} | {token: string}
 * @returns \{isUser: boolean, isMember: boolean, isMentor: boolean, isOfficer: boolean} the auth level
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const user = await prisma.user.findFirst({
    where:
      "email" in body
        ? {
            email: body.email,
          }
        : {
            session: {
              some: {
                sessionToken: body.token,
              },
            },
          },
    select: {
      mentor: {
        where: {
          isActive: true,
        },
      },
      officers: {
        where: {
          is_active: true,
        },
      },
      isMember: true,
    },
  });

  // console.log("Getting Auth for ", body, user);

  const authLevel = {
    isUser: false,
    isMember: false,
    isMentor: false,
    isOfficer: false,
  };

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
