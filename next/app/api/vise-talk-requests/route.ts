import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/vise-talk-requests
 * Gets all ViSE talk requests (officer-only in production)
 * @param request - optional query param ?status=pending|scheduled|completed|declined
 * @returns ViseTalkRequest[]
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = status ? { status } : {};

  const requests = await prisma.viseTalkRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(requests);
}

/**
 * HTTP POST request to /api/vise-talk-requests
 * Create a new ViSE talk request (public - speakers submit themselves)
 * @param request {speakerName, speakerEmail, speakerPhone?, affiliation?, talkTitle, talkAbstract, speakerBio, preferredDates, talkFormat}
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
      "speakerName" in body &&
      "speakerEmail" in body &&
      "talkTitle" in body &&
      "talkAbstract" in body &&
      "speakerBio" in body &&
      "preferredDates" in body &&
      "talkFormat" in body
    )
  ) {
    return new Response(
      '"speakerName", "speakerEmail", "talkTitle", "talkAbstract", "speakerBio", "preferredDates", and "talkFormat" are all required',
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.speakerEmail)) {
    return new Response("Invalid email format", { status: 400 });
  }

  // Validate talk format
  const validFormats = ["in_person", "virtual", "hybrid"];
  if (!validFormats.includes(body.talkFormat)) {
    return new Response(
      `Invalid talk format. Must be one of: ${validFormats.join(", ")}`,
      { status: 400 }
    );
  }

  const {
    speakerName,
    speakerEmail,
    speakerPhone,
    affiliation,
    talkTitle,
    talkAbstract,
    speakerBio,
    preferredDates,
    talkFormat,
  } = body;

  try {
    const newRequest = await prisma.viseTalkRequest.create({
      data: {
        speakerName,
        speakerEmail,
        speakerPhone,
        affiliation,
        talkTitle,
        talkAbstract,
        speakerBio,
        preferredDates,
        talkFormat,
        status: "pending",
      },
    });
    return Response.json(newRequest, { status: 201 });
  } catch (e) {
    console.error("Error creating ViSE talk request:", e);
    return new Response(`Failed to create ViSE talk request: ${e}`, {
      status: 500,
    });
  }
}

/**
 * HTTP PUT request to /api/vise-talk-requests
 * Update a ViSE talk request status - officer only
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
    return new Response("`id` and `status` must be included in request body", {
      status: 400,
    });
  }

  const { id, status } = body;

  if (!["pending", "scheduled", "completed", "declined"].includes(status)) {
    return new Response(
      'Status must be "pending", "scheduled", "completed", or "declined"',
      { status: 400 }
    );
  }

  try {
    const viseRequest = await prisma.viseTalkRequest.findUnique({
      where: { id },
    });

    if (!viseRequest) {
      return new Response("ViSE talk request not found", { status: 404 });
    }

    const updatedRequest = await prisma.viseTalkRequest.update({
      where: { id },
      data: { status },
    });

    return Response.json(updatedRequest);
  } catch (e) {
    console.error("Error updating ViSE talk request:", e);
    return new Response(`Failed to update ViSE talk request: ${e}`, {
      status: 500,
    });
  }
}

/**
 * HTTP DELETE request to /api/vise-talk-requests
 * Delete a ViSE talk request - officer only
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
    return new Response("A numeric `id` must be included in the request body", {
      status: 400,
    });
  }

  const { id } = body;

  try {
    const deletedRequest = await prisma.viseTalkRequest.delete({
      where: { id },
    });
    return Response.json(deletedRequest);
  } catch (e) {
    console.error("Error deleting ViSE talk request:", e);
    return new Response("Failed to delete ViSE talk request", { status: 500 });
  }
}
