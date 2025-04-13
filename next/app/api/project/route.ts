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
    !isProjectsHead(
      request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value ?? "NO TOKEN"
    )
  ) {
    return new Response("Only the projects head may modify projects", {
      status: 403,
    });
  }

  if (
    !(
      "title" in body &&
      "description" in body &&
      "leadid" in body &&
      "completed" in body
    )
  ) {
    return new Response(
      "'title', 'description', 'leadid', 'completed' must be included in the body",
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
  if (typeof body.leadid != "number") {
    return new Response("'leadid' must be a number", { status: 422 });
  }
  if (typeof body.completed != "boolean") {
    return new Response("'completed' must be a number", { status: 422 });
  }

  const data: {
    title: string;
    description: string;
    leadid: number;
    repoLink?: string;
    contentURL?: string;
    progress?: string;
    projectImage?: string;
    completed: boolean;
  } = {
    title: body.title,
    description: body.description,
    leadid: body.leadid,
    completed: body.completed,
  };

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
  if ("progress" in body) {
    if (typeof body.repoLink != "string") {
      return new Response("'progress' must be a string", { status: 422 });
    }
    data.progress = body.progress;
  }
  if ("projectImage" in body) {
    if (typeof body.projectImage != "string") {
      return new Response("'projectImage' must be a string", { status: 422 });
    }
    data.projectImage = body.projectImage;
  }
  if ("completed" in body) {
    if (typeof body.completed != "boolean") {
      return new Response("'completed' must be a boolean", { status: 422 });
    }
    data.completed = body.completed;
  }
  if (typeof body.title != "string") {
    return new Response("title must be a string", { status: 422 });
  }
  if (typeof body.description != "string") {
    return new Response("'description' must be a string", { status: 422 });
  }

  const project = await prisma.project.create({
    data,
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

  if (!("id" in body)) {
    return new Response("'id' must be included in the body", { status: 400 });
  }

  if (typeof body.id != "number") {
    return new Response("'id' must be an integer", { status: 422 });
  }

  if (
    !isProjectsHead(
      request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value ?? "NO TOKEN"
    )
  ) {
    return new Response("Only the projects head may modify projects", {
      status: 403,
    });
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
    leadid?: number;
    projectImage?: string;
    completed?: boolean;
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
  if ("leadid" in body) {
    if (typeof body.leadid != "number") {
      return new Response("'leadid' must be a number", { status: 422 });
    }
    data.leadid = body.leadid;
  }
  if ("projectImage" in body) {
    if (typeof body.projectImage != "string") {
      return new Response("'projectImage' must be a string", { status: 422 });
    }
    data.projectImage = body.projectImage;
  }
  if ("completed" in body) {
    if (typeof body.completed != "boolean") {
      return new Response("'completed' must be a boolean", { status: 422 });
    }
    data.completed = body.completed;
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

  if (!("id" in body)) {
    return new Response("'id' must be included in the body", { status: 400 });
  }
  if (!("id" in body)) {
    return new Response("'id' must be included in the body", { status: 400 });
  }

  if (typeof body.id != "number") {
    return new Response("'id' must be an integer", { status: 422 });
  }

  if (
    !isProjectsHead(
      request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value ?? "NO TOKEN"
    )
  ) {
    return new Response("Only the projects head may modify projects", {
      status: 403,
    });
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
