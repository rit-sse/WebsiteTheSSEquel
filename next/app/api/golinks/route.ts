import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function validateGoLink(goLink: string) {
  return /^[a-z\-]+$/.test(goLink);
}

/**
 * HTTP POST request to /api/golinks
 * Create a new Golink
 * @param request {url: string, golink: string, description: string, isPinned: boolean, isPublic: boolean}
 */
export async function POST(request: Request) {
  const body = await request.json();
  if (
    !(
      "url" in body &&
      "golink" in body &&
      "description" in body &&
      "isPinned" in body &&
      "isPublic" in body
    )
  ) {
    return new Response(
      ' "golink","description","isPinned" and "isPublic" are all required',
      { status: 400 }
    );
  }
  const { golink, url, description, isPublic, isPinned } = body;
  if (!validateGoLink(golink)) {
    return new Response(`Invalid golink "${golink}"; must be lowercase`, {
      status: 422,
    });
  }

  const newGolink = await prisma.goLinks.create({
    data: {
      golink: golink,
      url: url,
      description: description,
      isPublic: isPublic,
      isPinned: isPinned,
      updatedAt: new Date().toISOString(),
    },
  });
  return Response.json(newGolink);
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
    // use a regex to validate golink
    if (!validateGoLink(goLink)) {
      return new Response(`Invalid golink "${goLink}"; must be lowercase`, {
        status: 400,
      });
    }

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
