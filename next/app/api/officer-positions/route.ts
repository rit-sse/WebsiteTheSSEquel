import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/officer-positions
 * Gets all officer positions (both primary and committee head positions)
 * Includes count of active officers for each position
 * @returns [{id: number, title: string, is_primary: boolean, email: string, _count: {officers: number}}]
 */
export async function GET() {
  const positions = await prisma.officerPosition.findMany({
    select: {
      id: true,
      title: true,
      is_primary: true,
      email: true,
      officers: {
        where: { is_active: true },
        select: { id: true }
      }
    },
    orderBy: [
      { is_primary: 'desc' },
      { title: 'asc' }
    ]
  });
  
  // Transform to include filled status
  const positionsWithStatus = positions.map(pos => ({
    id: pos.id,
    title: pos.title,
    is_primary: pos.is_primary,
    email: pos.email,
    isFilled: pos.officers.length > 0,
    activeOfficerCount: pos.officers.length
  }));
  
  return Response.json(positionsWithStatus);
}

/**
 * HTTP POST request to /api/officer-positions
 * Create a new officer position
 * @param request { title: string, email: string, is_primary?: boolean }
 * @returns created position object
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("title" in body && "email" in body)) {
    return new Response('"title" and "email" are required', { status: 400 });
  }

  const { title, email, is_primary } = body;

  try {
    const position = await prisma.officerPosition.create({
      data: {
        title,
        email,
        is_primary: is_primary ?? false
      }
    });
    return Response.json(position, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return new Response('A position with this title or email already exists', { status: 409 });
    }
    return new Response(`Failed to create position: ${e}`, { status: 500 });
  }
}

/**
 * HTTP PUT request to /api/officer-positions
 * Update an existing officer position
 * @param request { id: number, title?: string, email?: string, is_primary?: boolean }
 * @returns updated position object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("id" in body)) {
    return new Response('"id" is required', { status: 400 });
  }

  const { id, title, email, is_primary } = body;

  const data: { title?: string; email?: string; is_primary?: boolean } = {};
  if (title !== undefined) data.title = title;
  if (email !== undefined) data.email = email;
  if (is_primary !== undefined) data.is_primary = is_primary;

  try {
    const position = await prisma.officerPosition.update({
      where: { id },
      data
    });
    return Response.json(position);
  } catch (e: any) {
    if (e.code === 'P2025') {
      return new Response('Position not found', { status: 404 });
    }
    if (e.code === 'P2002') {
      return new Response('A position with this title or email already exists', { status: 409 });
    }
    return new Response(`Failed to update position: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/officer-positions
 * Delete an officer position (only if no active officers)
 * @param request { id: number }
 * @returns deleted position object
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
    // Check if there are any active officers in this position
    const activeOfficers = await prisma.officer.count({
      where: { position_id: id, is_active: true }
    });

    if (activeOfficers > 0) {
      return new Response('Cannot delete position with active officers. Remove officers first.', { status: 409 });
    }

    // Delete any inactive officer records for this position first
    await prisma.officer.deleteMany({
      where: { position_id: id }
    });

    const position = await prisma.officerPosition.delete({
      where: { id }
    });
    return Response.json(position);
  } catch (e: any) {
    if (e.code === 'P2025') {
      return new Response('Position not found', { status: 404 });
    }
    return new Response(`Failed to delete position: ${e}`, { status: 500 });
  }
}
