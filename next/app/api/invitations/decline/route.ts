import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * HTTP POST request to /api/invitations/decline
 * Decline a pending invitation
 * @param request {invitationId: number}
 */
export async function POST(request: NextRequest) {
  // Get the logged-in user's session token
  const authToken = getSessionToken(request);

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

  const body = await request.json();

  if (!("invitationId" in body)) {
    return new Response('"invitationId" is required', { status: 400 });
  }

  const { invitationId } = body;

  // Find the invitation
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      position: true,
    },
  });

  if (!invitation) {
    return new Response("Invitation not found", { status: 404 });
  }

  // Verify the invitation email matches the logged-in user's email
  if (invitation.invitedEmail !== loggedInUser.email) {
    return new Response(
      "This invitation is for a different email address",
      { status: 403 }
    );
  }

  try {
    // Delete the invitation
    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    console.log(
      `User ${loggedInUser.email} declined ${invitation.type} invitation`
    );

    return Response.json({
      success: true,
      message: "Invitation declined",
    });
  } catch (e: any) {
    console.error("Error declining invitation:", e);
    return new Response(`Failed to decline invitation: ${e.message}`, {
      status: 500,
    });
  }
}
