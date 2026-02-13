import { MENTOR_HEAD_TITLE } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { resolveUserImage } from "@/lib/s3Utils";

export const dynamic = "force-dynamic";

/**
 * Check if user can manage mentors (Mentoring Head or Primary Officer)
 */
async function canManageMentors(sessionToken: string | undefined): Promise<boolean> {
  if (!sessionToken) return false;

  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken,
        },
      },
    },
    select: {
      officers: {
        where: { is_active: true },
        select: {
          position: {
            select: {
              title: true,
              is_primary: true,
            },
          },
        },
      },
    },
  });

  if (!user) return false;

  return user.officers.some(
    (officer) =>
      officer.position.title === MENTOR_HEAD_TITLE ||
      officer.position.is_primary
  );
}

/**
 * HTTP GET request to /api/mentor/
 * @return list of mentor objects with detailed information
 */
export async function GET(request: NextRequest) {
  const detailed = request.nextUrl.searchParams.get("detailed") === "true";

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
          profileImageKey: true,
          googleImageURL: true,
          description: true,
          linkedIn: true,
          gitHub: true,
        },
      },
      ...(detailed && {
        mentorSkill: {
          select: {
            skill: {
              select: {
                id: true,
                skill: true,
              },
            },
          },
        },
        courseTaken: {
          select: {
            course: {
              select: {
                id: true,
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
            },
          },
        },
        scheduleBlocks: {
          select: {
            id: true,
            weekday: true,
            startHour: true,
            scheduleId: true,
          },
        },
      }),
    },
    orderBy: [
      { isActive: "desc" },
      { user: { name: "asc" } },
    ],
  });

  const mentorsWithImage = allMentors.map((mentor) => ({
    ...mentor,
    user: {
      ...mentor.user,
      image: resolveUserImage(mentor.user.profileImageKey, mentor.user.googleImageURL),
    },
  }));

  return Response.json(mentorsWithImage);
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

  // Only Mentoring Head or Primary Officers may modify mentors
  const sessionToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
  if (!(await canManageMentors(sessionToken))) {
    return new Response("Only the Mentoring Head or Primary Officers may modify mentorships", {
      status: 403,
    });
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
    return new Response(`Failed to create mentor: ${e}`, { status: 500 });
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

  // Only Mentoring Head or Primary Officers may modify mentors
  const sessionToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
  if (!(await canManageMentors(sessionToken))) {
    return new Response("Only the Mentoring Head or Primary Officers may modify mentorships", {
      status: 403,
    });
  }

  // mentor object from database
  const mentorExists = await prisma.mentor.findUnique({ where: { id: id } });
  if (mentorExists == null) {
    return new Response(`Couldn't find mentor ID ${id}`, { status: 404 });
  }
  
  // Delete related records
  await prisma.courseTaken.deleteMany({
    where: { mentorId: id },
  });
  await prisma.mentorSkill.deleteMany({
    where: { mentor_Id: id },
  });
  await prisma.schedule.deleteMany({
    where: { mentorId: id },
  });
  await prisma.scheduleBlock.deleteMany({
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

  // Only Mentoring Head or Primary Officers may modify mentors
  const sessionToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
  if (!(await canManageMentors(sessionToken))) {
    return new Response("Only the Mentoring Head or Primary Officers may modify mentorships", {
      status: 403,
    });
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
