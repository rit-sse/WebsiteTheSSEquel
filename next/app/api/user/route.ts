import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/user/
 * @returns list of user objects
 */
export async function GET() {
  const allDepts = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  return Response.json(allDepts);
}

/**
 * Create a new user
 * HTTP POST request to /api/user/
 * @param request { name: string, email: string }
 * @return user object that was created
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // make sure the name and email properties are included
  if (!("name" in body && "email" in body)) {
    return new Response('"name" and "email" must be included in request body', {
      status: 422,
    });
  }
  const name = body.name;
  const email = body.email;

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });
    return Response.json(user, { status: 201 });
  } catch (e) {
    return new Response(`Failed to create user: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/user
 * @param request { id: number }
 * @returns user object previously at { id }
 */
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify the id is included
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  const id = body.id;

  const userExists = prisma.user.findUnique({ where: { id } });
  if (userExists == null) {
    return new Response(`Couldn't find user ID ${id}`, { status: 404 });
  }

  try {
    await prisma.quote.deleteMany({ where: { user_id: id } });
    await prisma.officer.deleteMany({
      where: { user_id: id },
    });
    await prisma.account.deleteMany({ where: { userId: id } });
    await prisma.session.deleteMany({ where: { userId: id } });
    const mentors = await prisma.mentor.findMany({ where: { user_Id: id } });
    // to delete a user, we must delete their mentor status
    for (const mentor of mentors) {
      // but to delete a mentor, we must delete all of their courses, schedule, and skills
      await prisma.courseTaken.deleteMany({
        where: { mentorId: mentor.id },
      });
      await prisma.scheduleBlock.deleteMany({ where: { mentorId: mentor.id } });
      await prisma.mentorSkill.deleteMany({ where: { mentor_Id: mentor.id } });
    }
    await prisma.mentor.deleteMany({ where: { user_Id: id } });
    const user = await prisma.user.delete({ where: { id } });
    return Response.json(user);
  } catch (e) {
    return new Response(`Failed to delete user: ${e}`, { status: 500 });
  }
}

/**
 * Update an existing user
 * HTTP PUT request to /api/user
 * @param request { id: number, name?: string, email?: string, linkedIn?: string, gitHub?: string, description?: string }
 * @returns updated user object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify that the id is included in the request
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  const id = body.id;

  // only update fields the caller wants to update
  const data: { name?: string; email?: string; description?: string; linkedIn?: string; gitHub?: string } = {};
  if ("name" in body) {
    data.name = body.name;
  }
  if ("email" in body) {
    data.email = body.email;
  }
  if ("description" in body) {
    data.description = body.description;
  }
  if ("linkedIn" in body) {
    data.linkedIn = body.linkedIn;
  }
  if ("gitHub" in body) {
    data.gitHub = body.gitHub;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return Response.json(user);
  } catch (e) {
    // make sure the selected user exists
    return new Response(`Failed to update user: ${e}`, { status: 500 });
  }
}
