import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/invitations/pending
 * Get all pending invitations for the currently logged-in user
 * @returns Array of invitation objects with related data
 */
export async function GET(request: NextRequest) {
  // Get the logged-in user's session token
  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

  // Find the logged-in user
  let loggedInUser = null;
  if (authToken) {
    loggedInUser = await prisma.user.findFirst({
      where: {
        session: {
          some: {
            sessionToken: authToken,
          },
        },
      },
      select: {
        id: true,
        email: true,
      },
    });
  }

  if (!loggedInUser) {
    return new Response("Unauthorized - please sign in first", { status: 401 });
  }

  // Fetch all pending invitations for this user's email
  const invitations = await prisma.invitation.findMany({
    where: {
      invitedEmail: loggedInUser.email,
      expiresAt: {
        gte: new Date(), // Only non-expired invitations
      },
    },
    include: {
      position: {
        select: {
          id: true,
          title: true,
          email: true,
          is_primary: true,
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Delete any expired invitations we might find
  await prisma.invitation.deleteMany({
    where: {
      invitedEmail: loggedInUser.email,
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return Response.json(invitations);
}
