import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CreateGoLinkSchema, UpdateGoLinkSchema } from "@/lib/schemas/golink";
import { ApiError } from "@/lib/apiError";

export const dynamic = 'force-dynamic';

/**
 * HTTP POST request to /api/golinks
 * Create a new Golink
 * @param request {url: string, golink: string, description: string, isPinned: boolean, isPublic: boolean}
 */
export async function POST(request: Request) {
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    return ApiError.validationError("Invalid JSON payload");
  }

  const parsed = CreateGoLinkSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { golink, url, description, isPublic, isPinned } = parsed.data;

  try {
    const newGolink = await prisma.goLinks.create({
        data: {
            golink,
            url,
            description,
            isPublic,
            isPinned,
            updatedAt: new Date().toISOString(),
        },
    });

    return NextResponse.json(newGolink, { status: 201 });

  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta?.target) {
           const targetField = Array.isArray(error.meta.target) ? error.meta.target[0] : error.meta.target;
           const failedValue = body[targetField] ?? '[unknown value]';
           return ApiError.conflict(`The ${targetField} '${failedValue}' already exists.`);
      }
    }
    return ApiError.internal();
  }
}

/**
 * HTTP DELETE request to /api/golinks
 * @param request {id:number}
 * @returns golink object previously at { id }
 */
export async function DELETE(request: Request) {
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    return ApiError.validationError("Invalid JSON payload");
  }

  if (!("id" in body) || typeof body.id !== 'number') {
    return ApiError.badRequest("A numeric `id` must be included in the request body");
  }
  const id = body.id;

  try {
    const deletedGoLink = await prisma.goLinks.delete({ where: { id } });
    return NextResponse.json(deletedGoLink, { status: 200 });

  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return ApiError.notFound(`GoLink with ID ${id}`);
      }
    }
    return ApiError.internal();
  }
}

/**
 * HTTP PUT request to /api/golinks
 * Update an existing golink
 * @param request {id: number, url?: string, golink?: string, description?: string, isPinned?: boolean, isPublic?: boolean}
 * @returns updated golink object
 */
export async function PUT(request: Request) {
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    return ApiError.validationError("Invalid JSON payload");
  }

  const parsed = UpdateGoLinkSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { id, ...fields } = parsed.data;

  const data: any = {};
  let hasUpdates = false;

  if (fields.url !== undefined) { data.url = fields.url; hasUpdates = true; }
  if (fields.golink !== undefined) { data.golink = fields.golink; hasUpdates = true; }
  if (fields.description !== undefined) { data.description = fields.description; hasUpdates = true; }
  if (fields.isPinned !== undefined) { data.isPinned = fields.isPinned; hasUpdates = true; }
  if (fields.isPublic !== undefined) { data.isPublic = fields.isPublic; hasUpdates = true; }

  if (!hasUpdates) {
     return ApiError.badRequest("No update fields provided in the request body.");
  }

  data.updatedAt = new Date().toISOString();

  try {
    const updatedGolink = await prisma.goLinks.update({
       where: { id },
       data
    });

    return NextResponse.json(updatedGolink, { status: 200 });

  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return ApiError.notFound(`GoLink with ID ${id}`);
      }
      if (error.code === 'P2002' && error.meta?.target) {
          const targetField = Array.isArray(error.meta.target) ? error.meta.target[0] : error.meta.target;
          const failedValue = body[targetField] ?? '[unknown value]';
          return ApiError.conflict(`The ${targetField} '${failedValue}' already exists.`);
      }
    }
    return ApiError.internal();
  }
}
