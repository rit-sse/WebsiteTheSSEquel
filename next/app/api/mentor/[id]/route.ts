import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/mentor/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns mentor with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // make sure the provided ID is a valid integer
  try {
    const id = parseInt(params.id);
    const mentor = await prisma.mentor.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        isActive: true,
        expirationDate: true,
        mentor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    // make sure the selected mentor exists
    if (mentor == null) {
      return new Response(`Didn't find Mentor ID ${id}`, { status: 404 });
    }
    return Response.json(mentor);
  } catch {
    return new Response("Invalid Mentor ID", { status: 400 });
  }
}
