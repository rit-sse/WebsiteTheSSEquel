import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * HTTP POST request to /api/invitations/accept
 * Accept a pending invitation
 * @param request {invitationId: number}
 */
export async function POST(request: NextRequest) {
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
        name: true,
        isMember: true,
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

  // Check if invitation has expired
  if (invitation.expiresAt < new Date()) {
    // Delete expired invitation
    await prisma.invitation.delete({
      where: { id: invitationId },
    });
    return new Response("This invitation has expired", { status: 410 });
  }

  try {
    if (invitation.type === "officer") {
      // Create officer record
      if (!invitation.positionId || !invitation.startDate || !invitation.endDate) {
        return new Response("Invalid officer invitation data", { status: 400 });
      }

      // Check if position already has an active officer (race condition protection)
      const activeOfficer = await prisma.officer.findFirst({
        where: {
          position_id: invitation.positionId,
          is_active: true,
        },
      });

      if (activeOfficer) {
        return new Response(
          "This position already has an active officer",
          { status: 409 }
        );
      }

      // Create the officer record
      const officer = await prisma.officer.create({
        data: {
          user_id: loggedInUser.id,
          position_id: invitation.positionId,
          start_date: invitation.startDate,
          end_date: invitation.endDate,
          is_active: true,
        },
      });

      // Delete the invitation
      await prisma.invitation.delete({
        where: { id: invitationId },
      });

      console.log(
        `User ${loggedInUser.email} accepted officer invitation for position ${invitation.position?.title}`
      );

      return Response.json({
        success: true,
        message: `You are now ${invitation.position?.title}!`,
        officer,
      });
    } else if (invitation.type === "user") {
      // Update user to be a member
      const updatedUser = await prisma.user.update({
        where: { id: loggedInUser.id },
        data: {
          isMember: true,
        },
      });

      // Delete the invitation
      await prisma.invitation.delete({
        where: { id: invitationId },
      });

      console.log(`User ${loggedInUser.email} accepted membership invitation`);

      return Response.json({
        success: true,
        message: "Welcome to SSE!",
        user: updatedUser,
      });
    } else {
      return new Response("Invalid invitation type", { status: 400 });
    }
  } catch (e: any) {
    console.error("Error accepting invitation:", e);
    return new Response(`Failed to accept invitation: ${e.message}`, {
      status: 500,
    });
  }
}
