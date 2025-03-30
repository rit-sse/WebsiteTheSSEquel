import { PROJECTS_HEAD_TITLE } from "@/lib/utils";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
const prisma = new PrismaClient();

async function isProjectsHead(sessionToken: string) {
  const officerPosition = await prisma.user.findFirst({
    where: {
      session: { some: { sessionToken } },
      officers: {
        some: { is_active: true, position: { title: PROJECTS_HEAD_TITLE } },
      },
    },
  });
  return officerPosition !== null;
}

export async function GET(request: Request) {
  const userProjects = await prisma.userProject.findMany({
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          description: true,
          repoLink: true,
          contentURL: true,
        },
      },
    },
  });
  return Response.json(userProjects, { status: 200 });
}

export async function POST(request: NextRequest) {
  let body: { userId: number; projectId: number };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("userId" in body) || !("projectId" in body)) {
    return new Response(
      "'userId' and 'projectId' must be included in the body",
      {
        status: 400,
      }
    );
  }

  if (typeof body.userId != "number") {
    return new Response("'userId' must be a number", { status: 422 });
  }
  if (typeof body.projectId != "number") {
    return new Response("'projectId' must be a number", { status: 422 });
  }

  if (
    !isProjectsHead(request.cookies.get("next-auth.session-token")?.value ?? "NO TOKEN")
  ) {
	return new Response("Only the projects head may modify users on projects", {status: 403});
  }

  const userProject = await prisma.userProject.create({
    data: {
      userId: body.userId,
      projectId: body.projectId,
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          description: true,
          repoLink: true,
          contentURL: true,
        },
      },
    },
  });
  return Response.json(userProject, { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body: { id: number; userId?: number; projectId?: number };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("id" in body)) {
    return new Response("'id' must be included in the body", {
      status: 400,
    });
  }
  if (typeof body.id != "number") {
    return new Response("'id' must be a number", { status: 422 });
  }

  if (
    !isProjectsHead(request.cookies.get("next-auth.session-token")?.value ?? "NO TOKEN")
  ) {
	return new Response("Only the projects head may modify users on projects", {status: 403});
  }

  const userProjectExists =
    (await prisma.userProject.findUnique({
      where: {
        id: body.id,
      },
    })) != null;
  if (!userProjectExists) {
    return new Response(`userProject with 'id' ${body.id} doesn't exist`, {
      status: 404,
    });
  }

  let data: { userId?: number; projectId?: number } = {};
  if ("userId" in body) {
    if (typeof body.userId != "number") {
      return new Response("'userId' must be a number", { status: 422 });
    }
    data.userId = body.userId;
  }
  if ("projectId" in body) {
    if (typeof body.projectId != "number") {
      return new Response("'projectId' must be a number", { status: 422 });
    }
    data.projectId = body.projectId;
  }

  const userProject = await prisma.userProject.update({
    where: {
      id: body.id,
    },
    data,
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          description: true,
          repoLink: true,
          contentURL: true,
        },
      },
    },
  });
  return Response.json(userProject, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  let body: { id: number };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("id" in body)) {
    return new Response("'id' must be included in the body");
  }

  if (
    !isProjectsHead(request.cookies.get("next-auth.session-token")?.value ?? "NO TOKEN")
  ) {
	return new Response("Only the projects head may modify users on projects", {status: 403});
  }

  const userProjectExists =
    (await prisma.userProject.findUnique({
      where: {
        id: body.id,
      },
    })) != null;

  if (!userProjectExists) {
    return new Response(`userProject with 'id' ${body.id} doesn't exist`);
  }

  const userProject = await prisma.userProject.delete({
    where: {
      id: body.id,
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          description: true,
          repoLink: true,
          contentURL: true,
        },
      },
    },
  });
  return Response.json(userProject, { status: 200 });
}
