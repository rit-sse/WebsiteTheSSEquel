import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest, NextResponse } from "next/server";

/**
 * Helper function to get user from session token
 */
async function getUserFromSession(request: NextRequest) {
  const authToken = getSessionToken(request);
  
  if (!authToken) {
    return null;
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
      name: true,
      email: true,
      officers: {
        where: { is_active: true },
        select: { id: true },
      },
    },
  });

  return user;
}

/**
 * HTTP GET request to /api/event/[id]/attendance
 * @returns list of attendees for the event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: eventId } = params;

  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        attendanceEnabled: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Get all attendees for this event
    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      eventId,
      eventTitle: event.title,
      attendanceEnabled: event.attendanceEnabled,
      attendees: attendances.map((a: { id: any; user: { id: any; name: any; email: any; }; createdAt: any; }) => ({
        id: a.id,
        userId: a.user.id,
        name: a.user.name,
        email: a.user.email,
        attendedAt: a.createdAt,
      })),
      count: attendances.length,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

/**
 * HTTP POST request to /api/event/[id]/attendance
 * Mark current user as attended
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: eventId } = params;

  // Get current user from session
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Check if event exists and has attendance enabled
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        attendanceEnabled: true,
        grantsMembership: true,
        purchaseRequests: {
          select: {
            id: true,
            attendanceData: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (!event.attendanceEnabled) {
      return NextResponse.json(
        { error: "Attendance tracking is not enabled for this event" },
        { status: 400 }
      );
    }

    // Check if user already attended
    const existingAttendance = await prisma.eventAttendance.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: "You have already marked attendance for this event", alreadyAttended: true },
        { status: 409 }
      );
    }

    // Create attendance record
    const attendance = await prisma.eventAttendance.create({
      data: {
        eventId,
        userId: user.id,
      },
    });

    // If event grants membership, create a membership record
    if (event.grantsMembership) {
      // Check if user already has a membership for this event
      const existingMembership = await prisma.memberships.findFirst({
        where: {
          userId: user.id,
          reason: `Attended event: ${event.title}`,
        },
      });

      if (!existingMembership) {
        await prisma.memberships.create({
          data: {
            userId: user.id,
            reason: `Attended event: ${event.title}`,
            dateGiven: new Date(),
          },
        });
      }
    }

    // If event has linked purchase requests, append user to attendanceData
    for (const pr of event.purchaseRequests) {
      const existingData = pr.attendanceData ? JSON.parse(pr.attendanceData) : [];
      
      // Check if user is already in the attendance data
      const userAlreadyInData = existingData.some(
        (attendee: { email: string }) => attendee.email === user.email
      );

      if (!userAlreadyInData) {
        const [firstName, ...lastNameParts] = user.name.split(" ");
        const lastName = lastNameParts.join(" ");
        
        existingData.push({
          firstName,
          lastName,
          email: user.email,
        });

        await prisma.purchaseRequest.update({
          where: { id: pr.id },
          data: {
            attendanceData: JSON.stringify(existingData),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      attendance: {
        id: attendance.id,
        eventId: attendance.eventId,
        userId: attendance.userId,
        createdAt: attendance.createdAt,
      },
      membershipGranted: event.grantsMembership,
    }, { status: 201 });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}

/**
 * HTTP DELETE request to /api/event/[id]/attendance
 * Remove attendance record (officer only, or own attendance)
 * Body: { attendanceId?: number, userId?: number }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: eventId } = params;

  // Get current user from session
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    // If no body, assume user wants to remove their own attendance
    body = {};
  }

  const isOfficer = user.officers.length > 0;
  const targetUserId = body.userId || user.id;

  // Non-officers can only remove their own attendance
  if (targetUserId !== user.id && !isOfficer) {
    return NextResponse.json(
      { error: "Only officers can remove other users' attendance" },
      { status: 403 }
    );
  }

  try {
    // Find the attendance record
    const attendance = await prisma.eventAttendance.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: targetUserId,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Delete the attendance record
    await prisma.eventAttendance.delete({
      where: { id: attendance.id },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance removed successfully",
    });
  } catch (error) {
    console.error("Error removing attendance:", error);
    return NextResponse.json(
      { error: "Failed to remove attendance" },
      { status: 500 }
    );
  }
}
