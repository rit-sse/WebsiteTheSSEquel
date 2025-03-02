import { MENTOR_HEAD_TITLE } from "@/lib/utils";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/mentor/
 * @return list of mentor objects
 */
export async function GET() {
  const allMentors = await prisma.mentor.findMany({
    select: {
      id: true,
      isActive: true,
      expirationDate: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return Response.json(allMentors);
}

/**
 * Create a new mentor
 * HTTP POST request to /api/mentor/
 * @param request { expirationDate: string, isActive: bool, userId: number }
 * @return mentor object that was created
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // make sure the expirationDate, isActive, and mentorId properties are included
  if (!("expirationDate" in body && "isActive" in body && "userId" in body)) {
    return new Response(
      '"expirationDate", "isActive", and "userId" must be included in request body',
      { status: 400 }
    );
  }
  const expirationDate = body.expirationDate;
  const isActive = body.isActive;
  const user_Id = body.userId;

  // Only the mentor head may modify the mentors
  if (
    (await prisma.user.findFirst({
      where: {
        session: {
          some: {
            sessionToken: request.cookies.get("next-auth.session-token")?.value,
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
    return new Response(null, { status: 403 });
  }

  try {
    const mentor = await prisma.mentor.create({
      data: {
        expirationDate,
        isActive,
        user_Id,
      },
    });
    return Response.json(mentor, { status: 201 });
  } catch (e) {
    return new Response(`Failed to create user: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/mentor
 * @param request { id: number }
 * @returns mentor object previously at { id }
 */
export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify the id is included
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 400 });
  }
  const id = body.id;

  // Only the mentor head may modify the mentors
  if (
    (await prisma.user.findFirst({
      where: {
        session: {
          some: {
            sessionToken: request.cookies.get("next-auth.session-token")?.value,
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
    return new Response(null, { status: 403 });
  }
  // mentor object from database
  const mentorExists = await prisma.mentor.findUnique({ where: { id: id } });
  if (mentorExists == null) {
    return new Response(`Couldn't find mentor ID ${id}`, { status: 404 });
  }
  await prisma.courseTaken.deleteMany({
    where: { mentorId: id },
  });
  await prisma.mentorSkill.deleteMany({
    where: { mentor_Id: id },
  });
  await prisma.schedule.deleteMany({
    where: { mentorId: id },
  });

  const mentor = await prisma.mentor.delete({ where: { id: id } });
  return Response.json(mentor);
}

/**
 * Update an existing mentor
 * HTTP PUT request to /api/mentor
 * @param request { id: number, expirationDate?: string, isActive?: bool, userId?: number }
 * @returns updated mentor object
 */
export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify that the id is included in the request
  if (!("id" in body)) {
    return new Response("`id` must be included in request body", {
      status: 400,
    });
  }
  const id = body.id;

  // Only the mentor head may modify the mentors
  if (
    (await prisma.user.findFirst({
      where: {
        session: {
          some: {
            sessionToken: request.cookies.get("next-auth.session-token")?.value,
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
    return new Response(null, { status: 403 });
  }
  // only update included fields
  const data: {
    expirationDate?: string;
    isActive?: boolean;
    user_Id?: number;
  } = {};
  if ("expirationDate" in body) {
    data.expirationDate = body.expirationDate;
  }
  if ("isActive" in body) {
    data.isActive = body.isActive;
  }
  if ("userId" in body) {
    data.user_Id = body.userId;
  }

  try {
    const mentor = await prisma.mentor.update({
      where: { id },
      data,
    });
    return Response.json(mentor);
  } catch (e) {
    // make sure the selected mentor exists
    return new Response(`Failed to update mentor: ${e}`, { status: 500 });
  }
}
