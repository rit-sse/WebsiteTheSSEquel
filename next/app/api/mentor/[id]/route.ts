import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'

/**
 * HTTP GET request to /api/mentor/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns mentor with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // make sure the provided ID is a valid integer
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const mentor = await prisma.mentor.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        isActive: true,
        expirationDate: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    // make sure the selected mentor exists
    if (mentor == null) {
      return new Response(`Could't find Mentor ID ${id}`, { status: 404 });
    }
    return Response.json(mentor);
  } catch {
    return new Response("Invalid Mentor ID", { status: 400 });
  }
}
