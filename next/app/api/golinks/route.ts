import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

function validateGoLink(goLink: string) {
  return /^[a-z\-]+$/.test(goLink);
}
import { prisma } from "@/lib/prisma"; // Assuming prisma client import
import { validateGoLink } from "@/lib/utils"; // Assuming validator import

/**
 * HTTP POST request to /api/golinks
 * Create a new Golink
 * @param request {url: string, golink: string, description: string, isPinned: boolean, isPublic: boolean}
 */
export async function POST(request: Request) {
  console.log("recieved post request")
  // --- Start Potential Failure Point 1 ---
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return new Response("Invalid JSON payload", { status: 400 });
  }
  // --- End Potential Failure Point 1 ---

  // --- Validation Check 1 ---
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
      { status: 400 } // Use 400 Bad Request for missing fields
    );
  }
  // --- End Validation Check 1 ---

  const { golink, url, description, isPublic, isPinned } = body;

  // --- Validation Check 2 ---
  if (!validateGoLink(golink)) {
    console.log(`Validation failed for golink: ${golink}`);
    return new Response(`Invalid golink format "${golink}"; must be lowercase alphanumeric/hyphen`, {
      status: 422, // 422 Unprocessable Entity is good for validation errors
    });
  }
  // --- End Validation Check 2 ---

  // --- Start Potential Failure Point 2 (Database Operation) ---
  try {
    console.log(`Attempting to create golink: ${golink}`);
    const newGolink = await prisma.goLinks.create({ // Make sure table name is 'goLinks' or adjust
      data: {
        golink: golink,
        url: url,
        description: description,
        isPublic: isPublic,
        isPinned: isPinned,
        updatedAt: new Date().toISOString(),
      },
    });
    console.log(`Successfully created golink ID: ${newGolink.id}`); // Assuming an ID field exists
    return Response.json(newGolink, { status: 201 }); // Use 201 Created for successful POST

  } catch (error: any) { // Catch database errors (or others)
    console.error("Error creating golink in database:", error);

    // Check for specific Prisma errors, e.g., unique constraint violation
    if (error.code === 'P2002') { // Prisma unique constraint error code
        // Target field is usually in error.meta.target
        const targetField = error.meta?.target?.[0] ?? 'field';
         console.log(`Unique constraint violation on field: ${targetField}`);
         return new Response(`The ${targetField} '${body[targetField]}' already exists.`, { status: 409 }); // 409 Conflict is good here
    }

    // Generic server error for other database issues
    return new Response("Failed to create GoLink due to a server error.", { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/golinks
 * @param request {id:number}
 * @returns golink object previously at { id }
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

  const goLinkExists = await prisma.goLinks.findUnique({ where: { id } });
  if (goLinkExists == null) {
    return new Response(`Couldn't find GoLink ID ${id}`);
  }

  const goLink = await prisma.goLinks.delete({ where: { id } });
  return Response.json(goLink);
}

/**
 * HTTP PUT request to /api/golinks
 * Update an existing golink
 * @param request {id: number, url?: string, golink?: string, description?: string, isPinned?: boolean, isPublic?: boolean}
 * @returns updated golink object
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
    return new Response("`id` must be included in request body", {
      status: 422,
    });
  }
  const id = body.id;

  // only include updated fields
  const data: {
    url?: string;
    golink?: string;
    description?: string;
    isPinned?: boolean;
    isPublic?: boolean;
  } = {};
  if ("url" in body) {
    data.url = body.url;
  }
  if ("golink" in body) {
    const goLink = body.golink;
    // use a regex to validate golink
    if (!validateGoLink(goLink)) {
      return new Response(`Invalid golink "${goLink}"; must be lowercase`, {
        status: 400,
      });
    }

    data.golink = goLink;
  }
  if ("description" in body) {
    data.description = body.description;
  }
  if ("isPinned" in body) {
    data.isPinned = body.isPinned;
  }
  if ("isPublic" in body) {
    data.isPublic = body.isPublic;
  }

  // apply updates to database
  try {
    const golink = await prisma.goLinks.update({ where: { id }, data });
    return Response.json(golink);
  } catch (e) {
    // make sure the selected golink exists
    return new Response(`Failed to update golink: ${e}`, { status: 500 });
  }
}
