import prisma from "@/lib/prisma";
import { resolveUserImage } from "@/lib/s3Utils";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/officer-positions
 * Gets all officer positions (both primary and committee head positions)
 * Includes current officer details (name, email, term) when position is filled
 * @returns [{id, title, is_primary, isFilled, currentOfficer?: {id, userId, name, email, start_date, end_date}}]
 */
export async function GET() {
  const positions = await prisma.officerPosition.findMany({
    where: { is_defunct: false },
    select: {
      id: true,
      title: true,
      is_primary: true,
      email: true,
      officers: {
        where: { is_active: true },
        select: {
          id: true,
          user_id: true,
          start_date: true,
          end_date: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImageKey: true,
              googleImageURL: true,
            }
          }
        },
        take: 1 // Only get the first active officer (should only be one)
      }
    },
    orderBy: [
      { is_primary: 'desc' },
      { title: 'asc' }
    ]
  });
  
  // Transform to include filled status and current officer details
  // Note: currentOfficer.email is the user's email, pos.email is the position alias
  const positionsWithStatus = positions.map((pos: any) => {
    const activeOfficer = pos.officers[0];
    return {
      id: pos.id,
      title: pos.title,
      is_primary: pos.is_primary,
      email: pos.email, // Position alias email (e.g., sse-president@rit.edu)
      isFilled: pos.officers.length > 0,
      currentOfficer: activeOfficer ? {
        id: activeOfficer.id,
        userId: activeOfficer.user.id,
        name: activeOfficer.user.name,
        email: activeOfficer.user.email, // User's actual email
        image: resolveUserImage(activeOfficer.user.profileImageKey, activeOfficer.user.googleImageURL),
        start_date: activeOfficer.start_date,
        end_date: activeOfficer.end_date
      } : null
    };
  });
  
  return Response.json(positionsWithStatus);
}

/**
 * HTTP POST request to /api/officer-positions
 * Create a new officer position
 * @param request { title: string, email?: string, is_primary?: boolean }
 * @returns created position object
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("title" in body)) {
    return new Response('"title" is required', { status: 400 });
  }

  const { title, is_primary } = body;
  
  // Auto-generate email from title if not provided (e.g., "Vice President" -> "sse-vice-president@rit.edu")
  const email = body.email || `sse-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}@rit.edu`;

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
