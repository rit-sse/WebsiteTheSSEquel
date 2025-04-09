import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/event/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns event with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // make sure the provided ID is a valid integer
  try {
    const id = parseInt(params.id);
    const dept = await prisma.event.findUnique({
      where: {
        id,
      },
      select: {
        title: true,
        description: true,
        image: true,
        date: true,
        location: true,
      },
    });
    // make sure the selected event exists
    if (dept == null) {
      return new Response(`Didn't find Event ID ${id}`, { status: 404 });
    }
    return Response.json(dept);
  } catch {
    return new Response("Invalid Event ID", { status: 422 });
  }
}
