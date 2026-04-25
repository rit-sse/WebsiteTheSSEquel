import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/recruiting-talk-requests
 * Gets all recruiting talk requests (officer-only in production)
 * @param request - optional query param ?status=pending|scheduled|completed|declined
 * @returns RecruitingTalkRequest[]
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = status ? { status } : {};

  const requests = await prisma.recruitingTalkRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(requests);
}

/**
 * HTTP POST request to /api/recruiting-talk-requests
 * Create a new recruiting talk request (public - anyone can submit)
 * @param request {companyName, contactName, contactEmail, contactPhone?, preferredDates, talkType, expectedAttendees?, description?}
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Validate required fields
  if (
    !(
      "companyName" in body &&
      "contactName" in body &&
      "contactEmail" in body &&
      "preferredDates" in body &&
      "talkType" in body
    )
  ) {
    return new Response(
      '"companyName", "contactName", "contactEmail", "preferredDates", and "talkType" are all required',
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.contactEmail)) {
    return new Response("Invalid email format", { status: 400 });
  }

  // Validate talk type
  const validTalkTypes = ["tech_talk", "interview_session", "workshop", "info_session"];
  if (!validTalkTypes.includes(body.talkType)) {
    return new Response(
      `Invalid talk type. Must be one of: ${validTalkTypes.join(", ")}`,
      { status: 400 }
    );
  }

  const {
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    preferredDates,
    talkType,
    expectedAttendees,
    description,
  } = body;

  try {
    const newRequest = await prisma.recruitingTalkRequest.create({
      data: {
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        preferredDates,
        talkType,
        expectedAttendees: expectedAttendees ? parseInt(expectedAttendees, 10) : null,
        description,
        status: "pending",
      },
    });
    return Response.json(newRequest, { status: 201 });
  } catch (e) {
    console.error("Error creating recruiting talk request:", e);
    return new Response(`Failed to create recruiting talk request: ${e}`, { status: 500 });
  }
}

/**
 * HTTP PUT request to /api/recruiting-talk-requests
 * Update a recruiting talk request status - officer only
 * @param request {id: number, status: 'pending' | 'scheduled' | 'completed' | 'declined'}
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("id" in body) || !("status" in body)) {
    return new Response("`id` and `status` must be included in request body", { status: 400 });
  }

  const { id, status } = body;

  if (!["pending", "scheduled", "completed", "declined"].includes(status)) {
    return new Response(
      'Status must be "pending", "scheduled", "completed", or "declined"',
      { status: 400 }
    );
  }

  try {
    const talkRequest = await prisma.recruitingTalkRequest.findUnique({
      where: { id },
    });

    if (!talkRequest) {
      return new Response("Recruiting talk request not found", { status: 404 });
    }

    const updatedRequest = await prisma.recruitingTalkRequest.update({
      where: { id },
      data: { status },
    });

    return Response.json(updatedRequest);
  } catch (e) {
    console.error("Error updating recruiting talk request:", e);
    return new Response(`Failed to update recruiting talk request: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/recruiting-talk-requests
 * Delete a recruiting talk request - officer only
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
    return new Response("A numeric `id` must be included in the request body", { status: 400 });
  }

  const { id } = body;

  try {
    const deletedRequest = await prisma.recruitingTalkRequest.delete({
      where: { id },
    });
    return Response.json(deletedRequest);
  } catch (e) {
    console.error("Error deleting recruiting talk request:", e);
    return new Response("Failed to delete recruiting talk request", { status: 500 });
  }
}
