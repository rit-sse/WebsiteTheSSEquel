import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/course/
 * @returns list of course objects
 */
export async function GET() {
  const allCourses = await prisma.course.findMany({
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
  });
  return Response.json(allCourses);
}

/**
 * Create a new course
 * HTTP POST request to /api/course/
 * @param request { title: string, code: int, departmentId: int }
 * @return course object that was created
 */

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // make sure the title and code properties are included
  if (!("title" in body && "code" in body && "departmentId" in body)) {
    return new Response(
      '"title", "code", and "departmentId" must be included in request body',
      { status: 422 }
    );
  }
  const title = body.title;
  const code = body.code;
  const departmentId = body.departmentId;

  try {
    const course = await prisma.course.create({
      data: {
        title,
        code,
        departmentId,
      },
    });
    return Response.json(course, { status: 201 });
  } catch (e) {
    return new Response(`Failed to create user: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/course
 * @param request { id: number }
 * @returns course object previously at { id }
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
  await prisma.courseTaken.deleteMany({ where: { courseId: id } });

  // make sure the specified course exists
  try {
    const course = await prisma.course.delete({ where: { id } });
    return Response.json({ course });
  } catch {
    return new Response(`Couldn't find course ID ${id}`, { status: 404 });
  }
}

/**
 * Update existing course
 * HTTP PUT request to /api/course
 * @param request { id: number, title?: string, code?: int }
 * @returns updated course object
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

  // only update included fields
  const data: { title?: string; code?: number } = {};
  if ("title" in body) {
    data.title = body.title;
  }
  if ("code" in body) {
    data.code = body.code;
  }

  try {
    const course = await prisma.course.update({
      where: { id },
      data,
    });
    return Response.json(course);
  } catch (e) {
    // make sure the selected course exists
    return new Response(`Failed to update course: ${e}`, { status: 500 });
  }
}
