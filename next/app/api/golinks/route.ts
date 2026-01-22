import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

function validateGoLink(goLink: string): boolean {
  return /^[a-z\-]+$/.test(goLink);
}

/**
 * HTTP POST request to /api/golinks
 * Create a new Golink
 * @param request {url: string, golink: string, description: string, isPinned: boolean, isPublic: boolean}
 */
export async function POST(request: Request) {
  console.log("received post request");
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return new Response("Invalid JSON payload", { status: 400 });
  }

  if (
    !(
      "url" in body &&
      "golink" in body &&
      "description" in body &&
      "isPinned" in body &&
      "isPublic" in body
    )
  ) {
    console.log("Missing required fields in request body");
    return new Response(
      'Request body must include "url", "golink", "description", "isPinned", and "isPublic"',
      { status: 400 }
    );
  }

  const { golink, url, description, isPublic, isPinned } = body;

  if (!validateGoLink(golink)) {
      console.log(`Validation failed for golink: ${golink}`);
      return new Response(`Invalid golink format "${golink}"; must be lowercase alphanumeric/hyphen`, {
          status: 422,
      });
  }

  try {
    console.log("Attempting to create GoLink with data:", {
        golink, url, description, isPublic, isPinned
    });
    console.log("Using Prisma model: prisma.goLinks");

    const newGolink = await prisma.goLinks.create({
        data: {
            golink: golink,
            url: url,
            description: description,
            isPublic: isPublic,
            isPinned: isPinned,
            updatedAt: new Date().toISOString(), // <--- RESTORED to original request
            // Assuming 'createdAt' is handled by @default(now()) in your schema
        },
    });

    console.log("Successfully created GoLink:", newGolink);
    return NextResponse.json(newGolink, { status: 201 });

  } catch (error: any) {
    console.error("!!! ERROR Creating GoLink in Database !!!");
    console.error("Error Code:", error.code);
    console.error("Error Meta:", error.meta);
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    console.error("Stack Trace:", error.stack);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta?.target) {
           const targetField = Array.isArray(error.meta.target) ? error.meta.target[0] : error.meta.target;
           const failedValue = body[targetField] ?? '[unknown value]';
           console.log(`Unique constraint violation on field: ${targetField}`);
           return new Response(`The ${targetField} '${failedValue}' already exists.`, { status: 409 });
      }
    }
    return new Response("Failed to create GoLink due to a server error.", { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/golinks
 * @param request {id:number}
 * @returns golink object previously at { id }
 */
export async function DELETE(request: Request) {
  console.log("received delete request");
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return new Response("Invalid JSON payload", { status: 400 });
  }

  if (!("id" in body) || typeof body.id !== 'number') {
    return new Response("A numeric `id` must be included in the request body", { status: 400 });
  }
  const id = body.id;

  try {
    console.log(`Attempting to delete GoLink with ID: ${id}`);
    const deletedGoLink = await prisma.goLinks.delete({ where: { id } });
    console.log(`Successfully deleted GoLink ID: ${id}`, deletedGoLink);
    return NextResponse.json(deletedGoLink, { status: 200 });

  } catch (error: any) {
    console.error(`!!! ERROR Deleting GoLink ID ${id} !!!`);
    console.error("Error Code:", error.code);
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    console.error("Stack Trace:", error.stack);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return new Response(`GoLink with ID ${id} not found.`, { status: 404 });
      }
    }
    return new Response("Failed to delete GoLink due to a server error.", { status: 500 });
  }
}

/**
 * HTTP PUT request to /api/golinks
 * Update an existing golink
 * @param request {id: number, url?: string, golink?: string, description?: string, isPinned?: boolean, isPublic?: boolean}
 * @returns updated golink object
 */
export async function PUT(request: Request) {
  console.log("received put request");
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return new Response("Invalid JSON payload", { status: 400 });
  }

  if (!("id" in body) || typeof body.id !== 'number') {
    return new Response("A numeric `id` must be included in the request body", {
      status: 400,
    });
  }
  const id = body.id;

  const data: Prisma.GoLinksUpdateInput = {};
  let hasUpdates = false;

  if ("url" in body && typeof body.url === 'string') {
    data.url = body.url;
    hasUpdates = true;
  }
  if ("golink" in body && typeof body.golink === 'string') {
    const goLink = body.golink;
    if (!validateGoLink(goLink)) {
      return new Response(`Invalid golink format "${goLink}"; must be lowercase alphanumeric/hyphen`, {
        status: 422,
      });
    }
    data.golink = goLink;
    hasUpdates = true;
  }
  if ("description" in body && typeof body.description === 'string') {
    data.description = body.description;
    hasUpdates = true;
  }
  if ("isPinned" in body && typeof body.isPinned === 'boolean') {
    data.isPinned = body.isPinned;
    hasUpdates = true;
  }
  if ("isPublic" in body && typeof body.isPublic === 'boolean') {
    data.isPublic = body.isPublic;
    hasUpdates = true;
  }

  if (!hasUpdates) {
     return new Response("No update fields provided in the request body.", { status: 400 });
  }

  // Set updatedAt manually using the originally requested format
  data.updatedAt = new Date().toISOString(); // <--- RESTORED to original request format

  try {
    console.log(`Attempting to update GoLink ID: ${id} with data:`, data);

    const updatedGolink = await prisma.goLinks.update({
       where: { id },
       data // data object now includes the manually set updatedAt
    });

    console.log(`Successfully updated GoLink ID: ${id}`, updatedGolink);
    return NextResponse.json(updatedGolink, { status: 200 });

  } catch (error: any) {
    console.error(`!!! ERROR Updating GoLink ID ${id} !!!`);
    console.error("Error Code:", error.code);
    console.error("Error Meta:", error.meta);
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    console.error("Stack Trace:", error.stack);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return new Response(`GoLink with ID ${id} not found.`, { status: 404 });
      }
      if (error.code === 'P2002' && error.meta?.target) {
          const targetField = Array.isArray(error.meta.target) ? error.meta.target[0] : error.meta.target;
          const failedValue = body[targetField] ?? '[unknown value]';
           console.log(`Unique constraint violation on field during update: ${targetField}`);
           return new Response(`The ${targetField} '${failedValue}' already exists.`, { status: 409 });
      }
    }
    return new Response("Failed to update GoLink due to a server error.", { status: 500 });
  }
}
