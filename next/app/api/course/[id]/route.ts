import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/course/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns course with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // make sure the provided ID is a valid integer
  try {
    const id = parseInt(params.id);
    const course = await prisma.course.findUnique({
      where: {
        id,
      },
      select: {
        title: true,
        code: true,
        department: {
          select: {
            id: true,
            title: true,
            shortTitle: true,
          },
        },
      },
    });
    // make sure the selected course exists
    if (course == null) {
      return new Response(`Invalid Course ID ${id}`, { status: 404 });
    }
    return Response.json(course);
  } catch {
    return new Response("Invalid Course ID", { status: 422 });
  }
}
