import prisma from "@/lib/prisma";
import {NextRequest, NextResponse} from "next/server";
import {getGatewayAuthLevel} from "@/lib/authGateway";
import { getSessionToken } from "@/lib/sessionToken";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const dynamic = "force-dynamic";

/**
 * Helper function to get user from session token
 */
async function getUserFromSession(request: NextRequest) {
  const authToken = getSessionToken(request);
  
  if (!authToken) {
    return null;
  }

  return prisma.user.findFirst({
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
        where: {is_active: true},
        select: {id: true},
      },
    },
  });
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
 * If the event grants membership, ensure the user has a membership record.
 * Returns { granted: true, created: true } when a new membership was created,
 * { granted: true, created: false } when one already existed.
 */
async function ensureMembership(
  db: TxClient,
  userId: number,
  eventId: string,
  eventTitle: string
): Promise<{ granted: true; created: boolean }> {
  const reason = `Attended event: ${eventTitle} [${eventId}]`;
  const existing = await db.memberships.findFirst({
    where: { userId, reason },
  });

  if (existing) {
    return { granted: true, created: false };
  }

  await db.memberships.create({
    data: { userId, reason, dateGiven: new Date() },
  });
  return { granted: true, created: true };
}

/**
 * Best-effort update of purchase request attendance data.
 * Runs outside the main transaction so failures here never block check-in.
 */
async function updatePurchaseRequestAttendance(
  purchaseRequests: { id: number; attendanceData: string | null }[],
  user: { name: string; email: string }
) {
  for (const pr of purchaseRequests) {
    try {
      const existingData = pr.attendanceData ? JSON.parse(pr.attendanceData) : [];

      const alreadyPresent = existingData.some(
        (attendee: { email: string }) => attendee.email === user.email
      );
      if (alreadyPresent) continue;

      const nameParts = (user.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ");

      existingData.push({ firstName, lastName, email: user.email });

      await prisma.purchaseRequest.update({
        where: { id: pr.id },
        data: { attendanceData: JSON.stringify(existingData) },
      });
    } catch (err) {
      console.error(`Failed to update purchase request ${pr.id} attendance data:`, err);
    }
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

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        attendanceEnabled: true,
        grantsMembership: true,
        purchaseRequests: {
          select: { id: true, attendanceData: true },
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

    const existingAttendance = await prisma.eventAttendance.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });

    if (existingAttendance) {
      let membershipGranted = false;
      if (event.grantsMembership) {
        try {
          const result = await prisma.$transaction(async (tx: TxClient) =>
            ensureMembership(tx, user.id, eventId, event.title)
          );
          membershipGranted = result.granted;
        } catch (err) {
          console.error("Failed to back-fill membership on 409 path:", err);
        }
      }

      return NextResponse.json(
        {
          error: "You have already marked attendance for this event",
          alreadyAttended: true,
          membershipGranted,
          eventGrantsMembership: event.grantsMembership,
        },
        { status: 409 }
      );
    }

    let membershipGranted = false;
    const attendance = await prisma.$transaction(async (tx: TxClient) => {
      const record = await tx.eventAttendance.create({
        data: { eventId, userId: user.id },
      });

      if (event.grantsMembership) {
        const result = await ensureMembership(tx, user.id, eventId, event.title);
        membershipGranted = result.granted;
      }

      return record;
    });

    // Purchase-request updates are best-effort and non-blocking.
    updatePurchaseRequestAttendance(event.purchaseRequests, user).catch((err) =>
      console.error("Background purchase-request attendance update failed:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      attendance: {
        id: attendance.id,
        eventId: attendance.eventId,
        userId: attendance.userId,
        createdAt: attendance.createdAt,
      },
      membershipGranted,
      eventGrantsMembership: event.grantsMembership,
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

  const authLevel = await getGatewayAuthLevel(request);
  const isOfficer = authLevel.isOfficer || user.officers.length > 0;
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
