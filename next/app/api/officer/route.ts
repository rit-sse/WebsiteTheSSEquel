import prisma from "@/lib/prisma";

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
          email: true,
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
 * Create a new officer
 * @param request {user_email: string, start_date: date, end_date: date, position: string}
 */
export async function POST(request: Request) {
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
  const user_id = (
    await prisma.user.findFirst({
      where: { email: user_email },
      select: { id: true },
    })
  )?.id;
  const position_id = (
    await prisma.officerPosition.findFirst({
      where: { title: position },
      select: { id: true },
    })
  )?.id;
  // If we couldn't find the user or position ID, give up
  if (user_id === undefined || position_id === undefined) {
    return new Response("User and position not found", { status: 404 });
  }
  // Delete any previous officers in this position
  await prisma.officer.deleteMany({
    where: { position: { title: position }, is_active: true },
  });
  const newOfficer = await prisma.officer.create({
    data: { user_id, position_id, start_date, end_date, is_active: true },
  });
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
 * Delete an officer record
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
    const officer = await prisma.officer.delete({
      where: { id }
    });
    return Response.json(officer);
  } catch (e: any) {
    if (e.code === 'P2025') {
      return new Response('Officer not found', { status: 404 });
    }
    return new Response(`Failed to delete officer: ${e}`, { status: 500 });
  }
}
