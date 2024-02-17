import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/hourBlock
 * @returns list of hourblock objects in model
 */
export async function GET() {
  const hourBlocks = await prisma.hourBlock.findMany({
    select: {
      weekday: true,
      startTime: true,
    },
  });

  return Response.json(hourBlocks);
}

/**
 * HTTP POST request to /api/hourBlock
 * @param request { weekday: string, startTime: Date}
 * @returns hourBlock object that was created
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  //validate request body
  if (!("weekday" in body && "startTime" in body)) {
    return new Response(
      '"weekday", "startTime" must be included in request body',
      { status: 400 }
    );
  }

  const weekday = body.weekday;
  //startTime string format: 'yyyy-mm-dd HH:MM:ss'
  const startTime = new Date(body.startTime);

  try {
    const create_hourBlock = await prisma.hourBlock.create({
      data: {
        weekday,
        startTime,
      },
    });
    return Response.json(create_hourBlock, { status: 201 });
  } catch (e) {
    return new Response(`Failed to create hourBlock: ${e}`, { status: 500 });
  }
}
