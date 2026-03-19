import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from "@/lib/schemas/project";
import { ApiError } from "@/lib/apiError";

async function isProjectsHead(request: NextRequest) {
  const authLevel = await getGatewayAuthLevel(request);
  return authLevel.isProjectsHead || authLevel.isPrimary;
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
    return ApiError.validationError("Invalid JSON");
  }

  if (!(await isProjectsHead(request))) {
    return ApiError.forbidden();
  }

  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success)
    return ApiError.validationError(
      "Validation failed",
      parsed.error.flatten()
    );

  const project = await prisma.project.create({ data: parsed.data });
  return Response.json(project, { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  if (!(await isProjectsHead(request))) {
    return ApiError.forbidden();
  }

  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success)
    return ApiError.validationError(
      "Validation failed",
      parsed.error.flatten()
    );

  const { id, ...fields } = parsed.data;

  const projectExists =
    (await prisma.project.findUnique({ where: { id } })) !== null;

  if (!projectExists) {
    return ApiError.notFound("Project");
  }

  const data = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );

  const project = await prisma.project.update({ where: { id }, data });
  return Response.json(project, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  if (!("id" in body) || typeof body.id !== "number") {
    return ApiError.badRequest("'id' must be a numeric integer");
  }

  if (!(await isProjectsHead(request))) {
    return ApiError.forbidden();
  }

  const projectExists =
    (await prisma.project.findUnique({ where: { id: body.id } })) != null;

  if (!projectExists) {
    return ApiError.notFound("Project");
  }

  const project = await prisma.project.delete({ where: { id: body.id } });
  return Response.json(project, { status: 200 });
}
