import prisma from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/officer
 * Gets all existing officers with full details
 * @returns [{id, is_active, start_date, end_date, user: {...}, position: {...}}]
 */
export async function GET() {
  const officers = await prisma.officer.findMany({
    select: {
      id: true,
      is_active: true,
      start_date: true,
      end_date: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      position: {
        select: {
          id: true,
          is_primary: true,
          title: true,
        },
      },
    },
    orderBy: [
      { position: { is_primary: 'desc' } },
      { position: { title: 'asc' } }
    ]
  });
  return Response.json(officers);
}

/**
 * HTTP POST request to /api/officer
 * Create a new officer and send notification email
 * @param request {user_email: string, start_date: date, end_date: date, position: string}
 */
export async function POST(request: NextRequest) {
  // Get the logged-in user's session token
  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
  
  // Find the logged-in user (for sending email)
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

  const body = await request.json();
  if (
    !(
      "user_email" in body &&
      "start_date" in body &&
      "end_date" in body &&
      "position" in body
    )
  ) {
    return new Response(
      ' "user_email","position","start_date" and "end_date" are all required',
      { status: 400 }
    );
  }
  const { user_email, position, start_date, end_date } = body;
  
  // Find the user being assigned
  const user = await prisma.user.findFirst({
    where: { email: user_email },
    select: { id: true, name: true, email: true },
  });
  
  // Find the position
  const positionRecord = await prisma.officerPosition.findFirst({
    where: { title: position },
    select: { id: true, title: true },
  });
  
  // If we couldn't find the user or position, give up
  if (!user || !positionRecord) {
    return new Response("User and position not found", { status: 404 });
  }
  
  // Delete any previous officers in this position
  await prisma.officer.deleteMany({
    where: { position: { title: position }, is_active: true },
  });
  
  // Create the new officer
  const newOfficer = await prisma.officer.create({
    data: { 
      user_id: user.id, 
      position_id: positionRecord.id, 
      start_date, 
      end_date, 
      is_active: true 
    },
  });

  // Grant a membership for becoming an officer
  await prisma.memberships.create({
    data: {
      userId: user.id,
      reason: `Officer: ${positionRecord.title}`,
      dateGiven: new Date(),
    },
  });
  
  // Send notification email to the new officer
  if (isEmailConfigured() && loggedInUser) {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const handoverUrl = `${baseUrl}/dashboard/positions/${positionRecord.id}/handover`;

    try {
      await sendEmail({
        to: user.email,
        subject: `You've been assigned as ${positionRecord.title} - SSE`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome, ${user.name}!</h1>
            <p>You have been assigned to the <strong>${positionRecord.title}</strong> position in the Society of Software Engineers.</p>
            <p>To help you get started, we've prepared a handover document with important information about your new role.</p>
            <div style="margin: 30px 0;">
              <a href="${handoverUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Handover Document
              </a>
            </div>
            <p>This document contains:</p>
            <ul>
              <li>Responsibilities of your role</li>
              <li>Key contacts and resources</li>
              <li>Notes from previous officers</li>
            </ul>
            <p>Please review and update the document as you settle into your new position.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #666; font-size: 12px;">
              This email was sent by ${loggedInUser.name} via the SSE website.
            </p>
          </div>
        `,
        text: `Welcome, ${user.name}!\n\nYou have been assigned to the ${positionRecord.title} position in the Society of Software Engineers.\n\nView your handover document at: ${handoverUrl}\n\nThis document contains important information about your role including responsibilities, key contacts, and notes from previous officers.`,
      });
      console.log(`Notification email sent to ${user.email} for ${positionRecord.title} assignment`);
    } catch (emailError) {
      console.error("Failed to send officer assignment notification email:", emailError);
    }
  }
  
  return Response.json(newOfficer);
}

/**
 * HTTP PUT request to /api/officer
 * Update an existing officer's term dates
 * @param request {id: number, start_date?: date, end_date?: date}
 * @returns updated officer object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("id" in body)) {
    return new Response("`id` must be included in request body", {
      status: 422,
    });
  }
  const id = body.id;

  const data: {
    start_date?: string;
    end_date?: string;
  } = {};
  if ("start_date" in body) {
    data.start_date = body.start_date;
  }
  if ("end_date" in body) {
    data.end_date = body.end_date;
  }

  try {
    const officer = await prisma.officer.update({ where: { id }, data });
    return Response.json(officer);
  } catch (e) {
    return new Response(`Failed to update officer: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/officer
 * Delete an officer record and any pending invitations for that position
 * @param request {id: number}
 * @returns deleted officer object
 */
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("id" in body) || typeof body.id !== 'number') {
    return new Response('A numeric "id" is required', { status: 400 });
  }

  const { id } = body;

  try {
    // Get the officer first to find the position
    const officer = await prisma.officer.findUnique({
      where: { id },
      select: { position_id: true }
    });

    if (!officer) {
      return new Response('Officer not found', { status: 404 });
    }

    // Delete any pending invitations for this position
    await prisma.invitation.deleteMany({
      where: {
        positionId: officer.position_id,
        type: 'officer'
      }
    });

    // Delete the officer record
    const deletedOfficer = await prisma.officer.delete({
      where: { id }
    });

    return Response.json(deletedOfficer);
  } catch (e: any) {
    if (e.code === 'P2025') {
      return new Response('Officer not found', { status: 404 });
    }
    return new Response(`Failed to delete officer: ${e}`, { status: 500 });
  }
}
