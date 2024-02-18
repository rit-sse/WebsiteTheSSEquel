import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/authLevel/
 * "None" => user does not exist
 * "User" => user exists but has no other credentials
 * "Member" => user is an SSE member but has no other credentials
 * "Mentor" => user is a mentor but not an officer
 * "Officer" => user is an officer
 * "Mega Rayquaza EX" => I am Burnt Out ;-;
 * @param request {email: string}
 * @returns {"None" | "User" | "Member" | "Mentor" | "Officer" | "Mega Rayquaza EX"} the auth level
 */
export async function GET(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
    select: {
      mentor: true,
      officers: true,
      isMember: true,
    },
  });
  if (user == null) {
    return new Response("None");
  }
  // deconstruct the user object
  const { mentor, officers, isMember } = user;
  if (officers.length > 0) {
    return new Response("Officer");
  }
  if (mentor.length > 0) {
    return new Response("Mentor");
  }
  if (isMember) {
    return new Response("Member");
  }
  return new Response("User");
}
