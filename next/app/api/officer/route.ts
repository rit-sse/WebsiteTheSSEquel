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
  // the previous officer in that position should become inactive
  await prisma.officer.updateMany({
    where: { position: { title: position } },
    data: { is_active: false },
  });
  const newOfficer = await prisma.officer.create({
    data: { user_id, position_id, start_date, end_date },
  });
  return Response.json(newOfficer);
}

/**
 * HTTP PUT request to /api/officer
 * Update an existing officer
 * @param request {id: number, start_date?: date, end_date?: date, is_active?: boolean}
 * @returns updated officer object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify that the id is included in the request
  if (!("id" in body)) {
    return new Response("`id` must be included in request body", {
      status: 422,
    });
  }
  const id = body.id;

  // only include updated fields
  const data: {
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  } = {};
  if ("start_date" in body) {
    data.start_date = body.start_date;
  }
  if ("end_date" in body) {
    data.end_date = body.end_date;
  }
  if ("is_active" in body) {
    data.is_active = body.is_active;
  }

  // apply updates to database
  try {
    const officer = await prisma.officer.update({ where: { id }, data });
    return Response.json(officer);
  } catch (e) {
    // make sure the selected officer exists
    return new Response(`Failed to update officer: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/officer
 * Delete an officer record or deactivate them
 * @param request {id: number, permanent?: boolean}
 * If permanent is true, deletes the record. Otherwise, just sets is_active to false.
 * @returns deleted/deactivated officer object
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

  const { id, permanent } = body;

  try {
    if (permanent) {
      // Permanently delete the officer record
      const officer = await prisma.officer.delete({
        where: { id }
      });
      return Response.json(officer);
    } else {
      // Just deactivate the officer
      const officer = await prisma.officer.update({
        where: { id },
        data: { is_active: false }
      });
      return Response.json(officer);
    }
  } catch (e: any) {
    if (e.code === 'P2025') {
      return new Response('Officer not found', { status: 404 });
    }
    return new Response(`Failed to delete officer: ${e}`, { status: 500 });
  }
}
