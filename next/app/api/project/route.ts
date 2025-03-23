import { PROJECTS_HEAD_TITLE } from "@/lib/utils";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const projects = await prisma.project.findMany();
  return Response.json(projects);
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

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
              title: PROJECTS_HEAD_TITLE,
            },
          },
        },
      },
    })) == null
  ) {
    return new Response("Only the projects head may modify projects", {
      status: 403,
    });
  }

  if (!("title" in body && "description" in body)) {
    return new Response(
      "'title' and 'description' must be included in the body",
      {
        status: 400,
      }
    );
  }

  if (typeof body.title != "string") {
    return new Response("title must be a string", { status: 422 });
  }
  if (typeof body.description != "string") {
    return new Response("'description' must be a string", { status: 422 });
  }

  let repoLink = "";
  let contentURL = "";
  if ("repoLink" in body) {
    if (typeof body.repoLink != "string") {
      return new Response("'repoLink' must be a string", { status: 422 });
    }
    repoLink = body.repoLink;
  }
  if ("contentURL" in body) {
    if (typeof body.contentURL != "string") {
      return new Response("'contentURL' must be a string", { status: 422 });
    }
    contentURL = body.contentURL;
  }

  const project = await prisma.project.create({
    data: {
      title: body.title,
      description: body.description,
      repoLink,
      contentURL,
    },
  });
  return Response.json(project, { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

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
              title: PROJECTS_HEAD_TITLE,
            },
          },
        },
      },
    })) == null
  ) {
    return new Response("Only the projects head may modify projects", {
      status: 403,
    });
  }

  if (!("id" in body)) {
    return new Response("'id' must be included in the body", { status: 400 });
  }

  if (typeof body.id != "number") {
    return new Response("'id' must be an integer", { status: 422 });
  }

  const project_exists =
    (await prisma.project.findUnique({
      where: { id: body.id },
    })) !== null;

  if (!project_exists) {
    return new Response(`project of 'id': ${body.id} doesn't exist`, {
      status: 404,
    });
  }

  const data: {
    title?: string;
    description?: string;
    repoLink?: string;
    contentURL?: string;
  } = {};
  if ("title" in body) {
    if (typeof body.title != "string") {
      return new Response("'title' must be a string", { status: 422 });
    }
    data.title = body.title;
  }
  if ("description" in body) {
    if (typeof body.description != "string") {
      return new Response("'description' must be a string", { status: 422 });
    }
    data.description = body.description;
  }
  if ("repoLink" in body) {
    if (typeof body.repoLink != "string") {
      return new Response("'repoLink' must be a string", { status: 422 });
    }
    data.repoLink = body.repoLink;
  }
  if ("contentURL" in body) {
    if (typeof body.contentURL != "string") {
      return new Response("'contentURL' must be a string", { status: 422 });
    }
    data.contentURL = body.contentURL;
  }

  const project = await prisma.project.update({
    where: {
      id: body.id,
    },
    data,
  });

  return Response.json(project, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

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
              title: PROJECTS_HEAD_TITLE,
            },
          },
        },
      },
    })) == null
  ) {
    return new Response("Only the projects head may modify projects", {
      status: 403,
    });
  }

  if (!("id" in body)) {
    return new Response("'id' must be included in the body", { status: 400 });
  }

  if (typeof body.id != "number") {
    return new Response("'id' must be an integer", { status: 422 });
  }

  const projectExists =
    (await prisma.project.findUnique({
      where: {
        id: body.id,
      },
    })) != null;

  if (!projectExists) {
    return new Response(`project with 'id' ${body.id} doesn't exist`, {
      status: 404,
    });
  }

  const project = await prisma.project.delete({
    where: { id: body.id },
  });

  return Response.json(project, { status: 200 });
}
