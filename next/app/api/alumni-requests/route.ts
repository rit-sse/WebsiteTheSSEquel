import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/alumni-requests
 * Gets all alumni requests (officer-only in production)
 * @param request - optional query param ?status=pending|approved|rejected
 * @returns AlumniRequest[]
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const where = status ? { status } : {};

  const requests = await prisma.alumniRequest.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });

  return Response.json(requests);
}

/**
 * HTTP POST request to /api/alumni-requests
 * Create a new alumni request (public - anyone can submit)
 * @param request {name, email, start_date, end_date, ...optional fields}
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Validate required fields
  if (!("name" in body && "email" in body && "start_date" in body && "end_date" in body)) {
    return new Response(
      '"name", "email", "start_date" and "end_date" are all required',
      { status: 400 }
    );
  }

  const { 
    name, 
    email, 
    linkedIn, 
    gitHub, 
    description, 
    image, 
    start_date, 
    end_date, 
    quote, 
    previous_roles,
    showEmail,
    alumniId
  } = body;

  try {
    // If this is an update request, verify the alumni exists
    if (alumniId) {
      const existingAlumni = await prisma.alumni.findUnique({ where: { id: alumniId } });
      if (!existingAlumni) {
        return new Response('Alumni record not found', { status: 404 });
      }
    }

    const newRequest = await prisma.alumniRequest.create({
      data: {
        name,
        email,
        linkedIn,
        gitHub,
        description,
        image,
        start_date,
        end_date,
        quote,
        previous_roles,
        showEmail: showEmail === true,
        alumniId: alumniId ?? null,
        status: 'pending'
      }
    });
    return Response.json(newRequest, { status: 201 });
  } catch (e) {
    console.error('Error creating alumni request:', e);
    return new Response(`Failed to create alumni request: ${e}`, { status: 500 });
  }
}

/**
 * HTTP PUT request to /api/alumni-requests
 * Update an alumni request status (approve/reject) - officer only
 * @param request {id: number, status: 'approved' | 'rejected'}
 * When approved, creates an Alumni record from the request data
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("id" in body) || !("status" in body)) {
    return new Response('`id` and `status` must be included in request body', { status: 400 });
  }

  const { id, status } = body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return new Response('Status must be "approved", "rejected", or "pending"', { status: 400 });
  }

  try {
    // Get the request first
    const alumniRequest = await prisma.alumniRequest.findUnique({
      where: { id }
    });

    if (!alumniRequest) {
      return new Response('Alumni request not found', { status: 404 });
    }

    // If approving, create or update the Alumni record
    if (status === 'approved' && alumniRequest.status !== 'approved') {
      const alumniData = {
        name: alumniRequest.name,
        email: alumniRequest.email,
        linkedIn: alumniRequest.linkedIn,
        gitHub: alumniRequest.gitHub,
        description: alumniRequest.description,
        image: alumniRequest.image,
        start_date: alumniRequest.start_date,
        end_date: alumniRequest.end_date,
        quote: alumniRequest.quote,
        previous_roles: alumniRequest.previous_roles,
        showEmail: alumniRequest.showEmail
      };

      if (alumniRequest.alumniId) {
        // Update existing alumni record
        await prisma.alumni.update({
          where: { id: alumniRequest.alumniId },
          data: alumniData
        });
      } else {
        // Create new alumni record
        // Reset the Alumni sequence if it's out of sync with existing data
        await prisma.$executeRawUnsafe(`SELECT setval('"Alumni_id_seq"', GREATEST((SELECT MAX(id) FROM "Alumni"), 1))`);
        await prisma.alumni.create({ data: alumniData });
      }
    }

    // Update the request status
    const updatedRequest = await prisma.alumniRequest.update({
      where: { id },
      data: { status }
    });

    return Response.json(updatedRequest);
  } catch (e) {
    console.error('Error updating alumni request:', e);
    return new Response(`Failed to update alumni request: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/alumni-requests
 * Delete an alumni request - officer only
 * @param request {id: number}
 */
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("id" in body) || typeof body.id !== 'number') {
    return new Response('A numeric `id` must be included in the request body', { status: 400 });
  }

  const { id } = body;

  try {
    const deletedRequest = await prisma.alumniRequest.delete({
      where: { id }
    });
    return Response.json(deletedRequest);
  } catch (e) {
    console.error('Error deleting alumni request:', e);
    return new Response('Failed to delete alumni request', { status: 500 });
  }
}
