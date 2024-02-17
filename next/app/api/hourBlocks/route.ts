import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/hourBlocks
 * @returns list of hourBlock objects in model
 */
export async function GET() {
  const hourBlocks = await prisma.hourBlock.findMany({
    select: {
      id: true,
      weekday: true,
      startTime: true,
    },
  });

  return Response.json(hourBlocks);
}

/**
 * HTTP POST request to /api/hourBlocks
 * @param request { weekday: string, startTime: Date }
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

/**
 * PUT request to /api/hourBlocks
 * @param request { id: number, weekday: string, startTime: Date }
 * @returns updated hourblock object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  //check if id is in request
  if (!("id" in body)) {
    return new Response('"id" must be included in request body', {
      status: 400,
    });
  }
  const id = body.id;

  const data: {
    weekday?: string;
    startTime?: Date;
  } = {};

  if ("weekday" in body) {
    data.weekday = body.weekday;
  }

  if ("startTime" in body) {
    //startTime string format: 'yyyy-mm-dd HH:MM:ss'
    data.startTime = new Date(body.startTime);
  }

  try {
    const hourBlock = await prisma.hourBlock.update({
      where: { id },
      data,
    });
    return Response.json(hourBlock);
  } catch (e) {
    return new Response(`Failed to update hourBlock: ${e}`, { status: 500 });
  }
}

/**
 * DELETE request to /api/hourBlocks
 * @param request {id: number}
 * @returns hourBlock object deleted at { id }
 */
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  //verify id is included
  if (!("id" in body)) {
    return new Response("id of hourBlock must be included", { status: 422 });
  }

  const id = body.id;
  const blockExists = prisma.hourBlock.findUnique({ where: { id } });

  //validate existence of hourBlock
  if (!blockExists) {
    return new Response("Could not find hourBlock ID", { status: 404 });
  }

  try {
    const hourBlock = await prisma.hourBlock.delete({ where: { id } });
    return Response.json(hourBlock);
  } catch (e) {
    return new Response(`Failed to delete hourBlock: ${e}`, { status: 500 });
  }
}
