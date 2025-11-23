import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to api/hourBlocks/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns hourBlock with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const hourBlock = await prisma.scheduleBlock.findUnique({
      where: {
        id,
      },
      select: {
        weekday: true,
        startHour: true,
      },
    });
    if (hourBlock == null) {
      return new Response(`Could not find hourBlock ID ${id}`, { status: 404 });
    }
    return Response.json(hourBlock);
  } catch {
    return new Response("Invalid hourBlock ID", { status: 422 });
  }
}
