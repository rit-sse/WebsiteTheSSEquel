import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/project/
 * @returns list of project objects
 */
export async function GET() {
  const allProjects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      image: true,
      techStack: true,
      description: true,
      progress: true,
      leader: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
  return Response.json(
    // return
    allProjects.map((project: any) => {
      project.contact = project.leader.email;
      project.leader = project.leader.name;
      return project;
    })
  );
}

/**
 * Create a new project
 * HTTP POST request to /api/project/
 * @param request { name: string, email: string }
 * @return project object that was created
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // make sure the name and email properties are included
  if (
    !(
      "title" in body &&
      "description" in body &&
      "leaderId" in body &&
      "image" in body &&
      "techStack" in body &&
      "progress" in body
    )
  ) {
    return new Response("All Project fields must be included in request body", {
      status: 422,
    });
  }
  const title = body.title;
  const description = body.description;
  const leaderId = body.leaderId;
  const image = body.image;
  const techStack = body.techStack;
  const progress = body.progress;

  try {
    const user = await prisma.project.create({
      data: {
        title,
        description,
        leaderId,
        image,
        techStack,
        progress,
      },
    });
    return Response.json(user, { status: 201 });
  } catch (e) {
    return new Response(`Failed to create project: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/project
 * @param request { id: number }
 * @returns project object previously at { id }
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

  try {
    const project = await prisma.project.delete({ where: { id } });
    return Response.json(project);
  } catch (e) {
    return new Response(`Failed to delete project: ${e}`, { status: 500 });
  }
}

/**
 * Update an existing project
 * HTTP PUT request to /api/project
 * @param request { id: number, name?: string, email?: string }
 * @returns updated project object
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
  const data: {
    title?: string;
    leaderId?: number;
    image?: string;
    techStack?: string;
    description?: string;
    progress?: string;
  } = {};
  if ("title" in body) {
    data.title = body.title;
  }
  if ("leaderId" in body) {
    data.leaderId = body.leaderId;
  }
  if ("image" in body) {
    data.image = body.image;
  }
  if ("techStack" in body) {
    data.image = body.image;
  }
  if ("description" in body) {
    data.description = body.description;
  }
  if ("progress" in body) {
    data.progress = body.progress;
  }

  try {
    const user = await prisma.project.update({
      where: { id },
      data,
    });
    return Response.json(user);
  } catch (e) {
    // make sure the selected user exists
    return new Response(`Failed to update project: ${e}`, { status: 500 });
  }
}
