import { MENTOR_HEAD_TITLE } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/schedule
 * @returns list of schedule objects
 */
export async function GET() {
  const coursesTaken = await prisma.schedule.findMany({
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
          startTime: true,
        },
      },
    },
  });

  return Response.json(coursesTaken);
}

/**
 * HTTP POST request to /api/schedule
 * @param {Object} request body of the HTTP POST request
 * @param {number} request.mentorId identifier for mentor
 * @param {number} request.hourBlockId identifier for hour block
 * @returns schedule object that was created
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // Only the mentor head may modify the mentor schedule
  if (
    (await prisma.user.findFirst({
      where: {
        session: {
          some: {
            sessionToken: request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value,
          },
        },
        officers: {
          some: {
            position: {
              title: MENTOR_HEAD_TITLE,
            },
            is_active: true,
          },
        },
      },
    })) == null
  ) {
    return new Response(
      "Only the mentoring head may modify the mentor schedule",
      {
        status: 403,
      }
    );
  }

  if (!("mentorId" in body && "hourBlockId" in body)) {
    return new Response("mentorId and hourBlockId must be in body", {
      status: 422,
    });
  }

  try {
    const schedule = await prisma.schedule.create({
      data: {
        mentorId: body.mentorId,
        hourBlockId: body.hourBlockId,
      },
    });
    return Response.json(schedule, { status: 201 });
  } catch (e) {
    return new Response(`Failed to create schedule: ${e}`, { status: 500 });
  }
}

/**
 * update an existing schedule block
 * HTTP PUT request to /api/schedule
 * @param {Object} request body of the HTTP PUT request
 * @param {number} request.id id of the object being updated
 * @param {number|undefined} request.mentorId identifier for mentor
 * @param {number|undefined} request.hourBlockId identifier for hourBlock
 * @returns schedule object that was updated
 */
export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // Only the mentor head may modify the mentor schedule
  if (
    (await prisma.user.findFirst({
      where: {
        session: {
          some: {
            sessionToken: request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value,
          },
        },
        officers: {
          some: {
            position: {
              title: MENTOR_HEAD_TITLE,
            },
            is_active: true,
          },
        },
      },
    })) == null
  ) {
    return new Response(
      "Only the mentoring head may modify the mentor schedule",
      {
        status: 403,
      }
    );
  }

  if (!("id" in body)) {
    return new Response("id must be in body", { status: 422 });
  }

  try {
    const schedule = await prisma.schedule.update({
      where: {
        id: body.id,
      },
      data: {
        mentorId: body.mentorId,
        hourBlockId: body.hourBlockId,
      },
    });
    return Response.json(schedule);
  } catch (e) {
    return new Response(`Failed to update schedule: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/schedule
 * @param {Object} request body of the HTTP DELETE request
 * @param {number} reuqest.id id of the object being deleted
 * @returns schedule previously at { id }
 */
export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // Only the mentor head may modify the mentor schedule
  if (
    (await prisma.user.findFirst({
      where: {
        session: {
          some: {
            sessionToken: request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value,
          },
        },
        officers: {
          some: {
            position: {
              title: MENTOR_HEAD_TITLE,
            },
            is_active: true,
          },
        },
      },
    })) == null
  ) {
    return new Response(
      "Only the mentoring head may modify the mentor schedule",
      {
        status: 403,
      }
    );
  }

  if (!("id" in body)) {
    return new Response("id must be in body", { status: 422 });
  }

  try {
    const schedule = await prisma.schedule.delete({
      where: {
        id: body.id,
      },
    });
    return Response.json(schedule);
  } catch (e) {
    return new Response(`Couldn't find schedule ID ${body.id}`, {
      status: 404,
    });
  }
}
