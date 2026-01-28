import prisma from "@/lib/prisma";

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
    const id = params.id;
    const event = await prisma.event.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        date: true,
        location: true,
        attendanceEnabled: true,
        grantsMembership: true,
      },
    });
    // make sure the selected event exists
    if (event == null) {
      return new Response(`Didn't find Event ID ${id}`, { status: 404 });
    }
    return Response.json(event);
  } catch {
    return new Response("Invalid Event ID", { status: 422 });
  }
}
