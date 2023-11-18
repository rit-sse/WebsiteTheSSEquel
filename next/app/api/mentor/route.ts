import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/mentor/
 * @returns list of mentor objects
 */
export async function GET() {
  const allMentors = await prisma.mentor.findMany({
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
  return Response.json(allMentors);
}

/**
 * HTTP POST request to /api/mentor/
 * @param request { expirationDate: string, isActive: bool, mentorId: number }
 * @return mentor object that was created
 */
export async function POST(request: Request) {
  const body = await request.json();

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

  const mentor = await prisma.mentor.create({
    data: {
      expirationDate,
      isActive,
      user_Id,
    },
  });
  return Response.json(mentor, { status: 201 });
}

/**
 * HTTP DELETE request to /api/mentor
 * @param request { id: number }
 * @returns mentor object previously at { id }
 */
export async function DELETE(request: Request) {
  const body = await request.json();

  // verify the id is included
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 400 });
  }
  const id = body.id;
  const mentorExists = await prisma.mentor.findUnique({ where: { id: id } })
  if (mentorExists == null) {
    return new Response(`Couldn't find mentor ID ${id}`, { status: 404 });
  }
  const deleteCourse = await prisma.courseTaken.deleteMany({ where: { mentorId: id } });
  const deleteSkills = await prisma.mentorSkill.deleteMany({ where: { mentor_Id: id } });
  const deleteScheduleRef = await prisma.schedule.deleteMany({ where: { mentorId: id } });

  const mentor = await prisma.mentor.delete({ where: { id: id } });
  // make sure the specified mentor exists
  if (mentor == null) {
    return new Response(`Couldn't find mentor ID ${id}`, { status: 404 });
  }
  return Response.json(mentor);
}

/**
 * HTTP PUT request to /api/mentor
 * @param request { id: number, expirationDate?: string, isActive?: bool, mentorId?: number }
 * @returns updated mentor object
 */
export async function PUT(request: Request) {
  const body = await request.json();

  // verify that the id is included in the request
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 400 });
  }
  const id = body.id;

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
  if ("mentorId" in body) {
    data.user_Id = body.mentorId;
  }

  const mentor = await prisma.mentor.update({
    where: { id },
    data,
  });
  // make sure the selected mentor exists
  if (mentor == null) {
    return new Response(`Couldn't find mentor ID ${id}`, { status: 404 });
  }
  return Response.json(mentor);
}
