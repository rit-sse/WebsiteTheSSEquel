import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/sponsorship-inquiries
 * Gets all sponsorship inquiries (officer-only in production)
 * @param request - optional query param ?status=pending|contacted|approved|declined
 * @returns SponsorshipInquiry[]
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = status ? { status } : {};

  const inquiries = await prisma.sponsorshipInquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(inquiries);
}

/**
 * HTTP POST request to /api/sponsorship-inquiries
 * Create a new sponsorship inquiry (public - anyone can submit)
 * @param request {companyName, contactName, contactEmail, contactPhone?, interestedTier, message?}
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
      "interestedTier" in body
    )
  ) {
    return new Response(
      '"companyName", "contactName", "contactEmail", and "interestedTier" are all required',
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.contactEmail)) {
    return new Response("Invalid email format", { status: 400 });
  }

  // Validate tier
  const validTiers = ["tier1", "tier2", "tier3", "custom"];
  if (!validTiers.includes(body.interestedTier)) {
    return new Response(
      `Invalid tier. Must be one of: ${validTiers.join(", ")}`,
      { status: 400 }
    );
  }

  const { companyName, contactName, contactEmail, contactPhone, interestedTier, message } = body;

  try {
    const newInquiry = await prisma.sponsorshipInquiry.create({
      data: {
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        interestedTier,
        message,
        status: "pending",
      },
    });
    return Response.json(newInquiry, { status: 201 });
  } catch (e) {
    console.error("Error creating sponsorship inquiry:", e);
    return new Response(`Failed to create sponsorship inquiry: ${e}`, { status: 500 });
  }
}

/**
 * HTTP PUT request to /api/sponsorship-inquiries
 * Update a sponsorship inquiry status - officer only
 * @param request {id: number, status: 'pending' | 'contacted' | 'approved' | 'declined'}
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

  if (!["pending", "contacted", "approved", "declined"].includes(status)) {
    return new Response(
      'Status must be "pending", "contacted", "approved", or "declined"',
      { status: 400 }
    );
  }

  try {
    const inquiry = await prisma.sponsorshipInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return new Response("Sponsorship inquiry not found", { status: 404 });
    }

    const updatedInquiry = await prisma.sponsorshipInquiry.update({
      where: { id },
      data: { status },
    });

    return Response.json(updatedInquiry);
  } catch (e) {
    console.error("Error updating sponsorship inquiry:", e);
    return new Response(`Failed to update sponsorship inquiry: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/sponsorship-inquiries
 * Delete a sponsorship inquiry - officer only
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
    const deletedInquiry = await prisma.sponsorshipInquiry.delete({
      where: { id },
    });
    return Response.json(deletedInquiry);
  } catch (e) {
    console.error("Error deleting sponsorship inquiry:", e);
    return new Response("Failed to delete sponsorship inquiry", { status: 500 });
  }
}
