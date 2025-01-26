import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  const officer = await prisma.officer.findMany({
    select: {
      is_active: true,
      start_date: true,
      end_date: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      position: {
        select: {
          is_primary: true,
          title: true,
        },
      },
    },
  });
  return Response.json(officer);
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
  await prisma.officer.updateMany({
    where: { position: { title: position } },
    data: { is_active: false },
  });
  const user_id = (
    await prisma.user.findFirst({ where: { email: user_email } })
  )?.id;
  const position_id = (
    await prisma.officerPosition.findFirst({ where: { email: user_email } })
  )?.id;
  const newOfficer = await prisma.officer.create({
    data: { user_id, position_id, start_date, end_date },
  });
  return Response.json(newOfficer);
}

/**
 * HTTP DELETE request to /api/golinks
 * @param request {id:number}
 * @returns golink object previously at { id }
 */
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify the id is included
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  const id = body.id;

  const goLinkExists = await prisma.goLinks.findUnique({ where: { id } });
  if (goLinkExists == null) {
    return new Response(`Couldn't find GoLink ID ${id}`);
  }

  const goLink = await prisma.goLinks.delete({ where: { id } });
  return Response.json(goLink);
}

/**
 * HTTP PUT request to /api/golinks
 * Update an existing golink
 * @param request {id: number, url?: string, golink?: string, description?: string, isPinned?: boolean, isPublic?: boolean}
 * @returns updated golink object
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
    url?: string;
    golink?: string;
    description?: string;
    isPinned?: boolean;
    isPublic?: boolean;
  } = {};
  if ("url" in body) {
    data.url = body.url;
  }
  if ("golink" in body) {
    const goLink = body.golink;

    data.golink = goLink;
  }
  if ("description" in body) {
    data.description = body.description;
  }
  if ("isPinned" in body) {
    data.isPinned = body.isPinned;
  }
  if ("isPublic" in body) {
    data.isPublic = body.isPublic;
  }

  // apply updates to database
  try {
    const golink = await prisma.goLinks.update({ where: { id }, data });
    return Response.json(golink);
  } catch (e) {
    // make sure the selected golink exists
    return new Response(`Failed to update golink: ${e}`, { status: 500 });
  }
}
