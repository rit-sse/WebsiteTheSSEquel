import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/departments/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns department with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const dept = await prisma.department.findUnique({
      where: {
        id,
      },
      select: {
        title: true,
        shortTitle: true,
        course: {
          select: {
            title: true,
            code: true,
          },
        },
      },
    });
    return Response.json(dept);
  } catch {
    return new Response("Invalid Department ID", { status: 400 });
  }
}
