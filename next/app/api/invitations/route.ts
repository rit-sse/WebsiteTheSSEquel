import prisma from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/invitations
 * Gets all pending invitations
 * @query type - Filter by invitation type ("officer" or "user")
 * @returns Array of invitation objects with related data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const where = type ? { type } : {};

  const invitations = await prisma.invitation.findMany({
    where,
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

  return Response.json(invitations);
}

/**
 * HTTP POST request to /api/invitations
 * Create a new invitation and send email
 * @param request {email: string, type: "officer" | "user", positionId?: number, startDate?: DateTime, endDate?: DateTime}
 */
export async function POST(request: NextRequest) {
  // Get the logged-in user's session token
  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

  // Find the logged-in user (for sending email and tracking who invited)
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
      },
    });
  }

  if (!loggedInUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();

  if (!("email" in body && "type" in body)) {
    return new Response('"email" and "type" are required', { status: 400 });
  }

  const { email, type, positionId, startDate, endDate, applicationId } = body;

  // Validate email domain
  if (!email.endsWith("@g.rit.edu")) {
    return new Response("Email must be an @g.rit.edu address", { status: 400 });
  }

  // Validate type
  if (type !== "officer" && type !== "user" && type !== "mentor") {
    return new Response('Type must be "officer", "user", or "mentor"', { status: 400 });
  }

  // For officer invitations, validate required fields
  if (type === "officer") {
    if (!positionId || !startDate || !endDate) {
      return new Response(
        'Officer invitations require "positionId", "startDate", and "endDate"',
        { status: 400 }
      );
    }

    // Check if position exists
    const position = await prisma.officerPosition.findUnique({
      where: { id: positionId },
    });

    if (!position) {
      return new Response("Position not found", { status: 404 });
    }

    // Check if position already has an active officer
    const activeOfficer = await prisma.officer.findFirst({
      where: {
        position_id: positionId,
        is_active: true,
      },
    });

    if (activeOfficer) {
      return new Response(
        "This position already has an active officer. Remove them first or wait for their term to end.",
        { status: 409 }
      );
    }
  }

  // For mentor invitations, validate and check if already a mentor
  if (type === "mentor") {
    // Check if user with this email is already an active mentor
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        mentor: {
          where: { isActive: true },
        },
      },
    });

    if (existingUser && existingUser.mentor.length > 0) {
      return new Response("This user is already an active mentor", { status: 409 });
    }
  }

  // Check if there's already a pending invitation for this email and type
  const existingInvitation = await prisma.invitation.findUnique({
    where: {
      invitedEmail_type: {
        invitedEmail: email,
        type: type,
      },
    },
  });

  if (existingInvitation) {
    return new Response(
      `An invitation for this email as a ${type} already exists`,
      { status: 409 }
    );
  }

  // Check if user already exists (for user invitations, they might already be a member)
  if (type === "user") {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: { Memberships: true },
        },
      },
    });

    if (existingUser && existingUser._count.Memberships >= 1) {
      return new Response("This user is already a member", { status: 409 });
    }
  }

  // Create the invitation
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

  // For mentor invitations, set default endDate to 1 year from now if not provided
  let mentorExpirationDate = null;
  if (type === "mentor") {
    mentorExpirationDate = endDate ? new Date(endDate) : new Date();
    if (!endDate) {
      mentorExpirationDate.setFullYear(mentorExpirationDate.getFullYear() + 1);
    }
  }

  const invitation = await prisma.invitation.create({
    data: {
      invitedEmail: email,
      type,
      positionId: type === "officer" ? positionId : null,
      applicationId: type === "mentor" && applicationId ? applicationId : null,
      startDate: type === "officer" ? new Date(startDate) : null,
      endDate: type === "officer" ? new Date(endDate) : (type === "mentor" ? mentorExpirationDate : null),
      invitedBy: loggedInUser.id,
      expiresAt,
    },
    include: {
      position: true,
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // If this is a mentor invitation linked to an application, update the application status
  if (type === "mentor" && applicationId) {
    try {
      await prisma.mentorApplication.update({
        where: { id: applicationId },
        data: { status: "invited" },
      });
    } catch (error) {
      console.error("Failed to update application status:", error);
      // Don't fail the request, the invitation is created
    }
  }

  // Send invitation email
  if (isEmailConfigured()) {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const acceptUrl = `${baseUrl}/accept-invitation`;

    try {
      if (type === "officer" && invitation.position) {
        await sendEmail({
          to: email,
          subject: `You've been invited to join SSE as ${invitation.position.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">You've been invited to join SSE!</h1>
              <p>Hi! You've been invited to join the Society of Software Engineers officer board as <strong>${invitation.position.title}</strong>.</p>
              <p>Your term will be from <strong>${new Date(invitation.startDate!).toLocaleDateString()}</strong> to <strong>${new Date(invitation.endDate!).toLocaleDateString()}</strong>.</p>
              <p>To accept this invitation, click the button below to sign in with your RIT Google account:</p>
              <div style="margin: 30px 0;">
                <a href="${acceptUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Sign In to Accept
                </a>
              </div>
              <p><em>This invitation expires in 30 days.</em></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="color: #666; font-size: 12px;">
                Questions? Contact ${invitation.inviter.name} at ${invitation.inviter.email}
              </p>
            </div>
          `,
          text: `You've been invited to join SSE as ${invitation.position.title}!\n\nYour term: ${new Date(invitation.startDate!).toLocaleDateString()} to ${new Date(invitation.endDate!).toLocaleDateString()}\n\nAccept your invitation at: ${acceptUrl}\n\nThis invitation expires in 30 days.\n\nQuestions? Contact ${invitation.inviter.name} at ${invitation.inviter.email}`,
        });
      } else if (type === "mentor") {
        // Mentor invitation email
        const expirationDate = invitation.endDate ? new Date(invitation.endDate).toLocaleDateString() : "1 year from acceptance";
        await sendEmail({
          to: email,
          subject: "You've been invited to become an SSE Mentor!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">You've been invited to become an SSE Mentor!</h1>
              <p>Hi! You've been invited to join the Society of Software Engineers as a <strong>Mentor</strong>.</p>
              <p>As a mentor, you'll help fellow students with homework, assignments, and test preparation in the SSE lab.</p>
              <p>Your mentorship expires: <strong>${expirationDate}</strong></p>
              <p>To accept this invitation, click the button below to sign in with your RIT Google account:</p>
              <div style="margin: 30px 0;">
                <a href="${acceptUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Sign In to Accept
                </a>
              </div>
              <p><strong>Mentor Responsibilities:</strong></p>
              <ul>
                <li>Help students with coursework during scheduled hours</li>
                <li>Maintain a welcoming and supportive environment</li>
                <li>Participate in mentor meetings and review sessions</li>
              </ul>
              <p><em>This invitation expires in 30 days.</em></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="color: #666; font-size: 12px;">
                Questions? Contact ${invitation.inviter.name} at ${invitation.inviter.email}
              </p>
            </div>
          `,
          text: `You've been invited to become an SSE Mentor!\n\nAs a mentor, you'll help fellow students with homework, assignments, and test preparation.\n\nMentorship expires: ${expirationDate}\n\nAccept your invitation at: ${acceptUrl}\n\nThis invitation expires in 30 days.\n\nQuestions? Contact ${invitation.inviter.name} at ${invitation.inviter.email}`,
        });
      } else {
        await sendEmail({
          to: email,
          subject: "You've been invited to join SSE",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">You've been invited to join SSE!</h1>
              <p>Hi! You've been invited to join the Society of Software Engineers.</p>
              <p>SSE is RIT's premier organization for software engineering students, offering mentoring, events, projects, and a supportive community.</p>
              <p>To complete your membership, click the button below to sign in with your RIT Google account:</p>
              <div style="margin: 30px 0;">
                <a href="${acceptUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Sign In to Join
                </a>
              </div>
              <p><strong>Member Benefits:</strong></p>
              <ul>
                <li>Access to mentoring programs</li>
                <li>Exclusive workshops and talks</li>
                <li>Networking opportunities</li>
                <li>Project collaboration</li>
              </ul>
              <p><em>This invitation expires in 30 days.</em></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="color: #666; font-size: 12px;">
                Questions? Contact ${invitation.inviter.name} at ${invitation.inviter.email}
              </p>
            </div>
          `,
          text: `You've been invited to join the Society of Software Engineers!\n\nSSE is RIT's premier organization for software engineering students.\n\nComplete your membership at: ${acceptUrl}\n\nThis invitation expires in 30 days.\n\nQuestions? Contact ${invitation.inviter.name} at ${invitation.inviter.email}`,
        });
      }
      console.log(`Invitation email sent to ${email} for ${type} invitation`);
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
    }
  }

  return Response.json(invitation, { status: 201 });
}

/**
 * HTTP DELETE request to /api/invitations
 * Cancel/revoke an invitation
 * @param request {id: number}
 */
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("id" in body) || typeof body.id !== "number") {
    return new Response('A numeric "id" is required', { status: 400 });
  }

  const { id } = body;

  try {
    const invitation = await prisma.invitation.delete({
      where: { id },
    });
    return Response.json(invitation);
  } catch (e: any) {
    if (e.code === "P2025") {
      return new Response("Invitation not found", { status: 404 });
    }
    return new Response(`Failed to delete invitation: ${e}`, { status: 500 });
  }
}
