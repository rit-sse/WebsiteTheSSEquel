import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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

  // TODO: Validate the titles
  const golink = body.golink;
  const url = body.url;
  const description = body.description;
  const isPublic = body.isPublic;
  const isPinned = body.isPinned;
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
