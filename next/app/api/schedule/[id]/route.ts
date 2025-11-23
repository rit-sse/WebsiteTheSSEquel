import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/schedule/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns schedule with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // make sure the provided ID is a valid integer
  try {
    const id = parseInt(params.id);
    const course = await prisma.schedule.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        mentorId: true,
        hourBlockId: true,
        mentor: {
          select: {
            id: true,
            user_Id: true,
            expirationDate: true,
            isActive: true,
          },
        },
        hourBlock: {
          select: {
            id: true,
            weekday: true,
            startHour: true,
          },
        },
      },
    });
    // make sure the selected course exists
    if (course == null) {
      return new Response(`Invalid Schedule ID ${id}`, { status: 404 });
    }
    return Response.json(course);
  } catch {
    return new Response("Invalid Schedule ID", { status: 422 });
  }
}
