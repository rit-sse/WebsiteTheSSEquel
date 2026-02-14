import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'

/**
 * HTTP GET request to /api/departments/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns department with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // make sure the provided ID is a valid integer
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const dept = await prisma.department.findUnique({
      where: {
        id,
      },
      select: {
        title: true,
        shortTitle: true,
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });
    // make sure the selected department exists
    if (dept == null) {
      return new Response(`Didn't find Department ID ${id}`, { status: 404 });
    }
    return Response.json(dept);
  } catch {
    return new Response("Invalid Department ID", { status: 422 });
  }
}
