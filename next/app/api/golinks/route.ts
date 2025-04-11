import { PrismaClient, Prisma } from "@prisma/client"; // Import Prisma types too
import { NextRequest, NextResponse } from "next/server"; // Use NextResponse for consistency maybe

// Instantiate Prisma Client - Place outside handlers to reuse the instance
const prisma = new PrismaClient();

// Make sure the route is dynamically evaluated
export const dynamic = 'force-dynamic';

// Helper function for validation
function validateGoLink(goLink: string): boolean {
  // Allow only lowercase letters and hyphens
  return /^[a-z\-]+$/.test(goLink);
}

/**
 * HTTP POST request to /api/golinks
 * Create a new Golink
 * @param request {url: string, golink: string, description: string, isPinned: boolean, isPublic: boolean}
 */
export async function POST(request: Request) {
  console.log("received post request");
  let body: any; // Consider defining a type/interface for the body

  // --- Parse Request Body ---
  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    // Use NextResponse for consistency if preferred
    return new Response("Invalid JSON payload", { status: 400 });
  }

  // --- Validation Check: Required Fields ---
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

  // --- Validation Check: GoLink Format ---
  if (!validateGoLink(golink)) {
      console.log(`Validation failed for golink: ${golink}`);
      return new Response(`Invalid golink format "${golink}"; must be lowercase alphanumeric/hyphen`, {
          status: 422, // Unprocessable Entity
      });
  }

  // --- Database Operation: Create ---
  try {
    console.log("Attempting to create GoLink with data:", {
        golink, url, description, isPublic, isPinned
    });
    console.log("Using Prisma model: prisma.goLinks"); // Adjust if model name is different

    const newGolink = await prisma.goLinks.create({ // Ensure 'goLinks' matches schema.prisma model name
        data: {
            golink: golink,
            url: url,
            description: description,
            isPublic: isPublic,
            isPinned: isPinned,
            // Add any other required fields from your schema here
        },
    });

    console.log("Successfully created GoLink:", newGolink);
    // Use Response.json or NextResponse.json
    return NextResponse.json(newGolink, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error("!!! ERROR Creating GoLink in Database !!!");
    console.error("Error Code:", error.code);
    console.error("Error Meta:", error.meta);
    console.error("Full Error Object:", JSON.stringify(error, null, 2)); // Stringify for better logging
    console.error("Stack Trace:", error.stack);

    // Handle known Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta?.target) {
           const targetField = Array.isArray(error.meta.target) ? error.meta.target[0] : error.meta.target;
           const failedValue = body[targetField] ?? '[unknown value]';
           console.log(`Unique constraint violation on field: ${targetField}`);
           return new Response(`The ${targetField} '${failedValue}' already exists.`, { status: 409 }); // 409 Conflict
      }
      // Add other specific Prisma error codes if needed
    }

    // Generic error for other database issues or unexpected errors
    return new Response("Failed to create GoLink due to a server error.", { status: 500 });
  }
} // <-------------------- THIS WAS THE MISSING BRACE

/**
 * HTTP DELETE request to /api/golinks
 * @param request {id:number}
 * @returns golink object previously at { id }
 */
export async function DELETE(request: Request) {
  console.log("received delete request");
  let body: any;

  // --- Parse Request Body ---
  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return new Response("Invalid JSON payload", { status: 400 });
  }

  // --- Validation Check: ID ---
  if (!("id" in body) || typeof body.id !== 'number') { // Also check type
    return new Response("A numeric `id` must be included in the request body", { status: 400 });
  }
  const id = body.id;

  // --- Database Operation: Delete ---
  try {
    console.log(`Attempting to delete GoLink with ID: ${id}`);

    // Optional: Check if it exists first (delete throws P2025 if not found)
    // const goLinkExists = await prisma.goLinks.findUnique({ where: { id } });
    // if (goLinkExists == null) {
    //   console.log(`GoLink ID ${id} not found for deletion.`);
    //   return new Response(`GoLink with ID ${id} not found.`, { status: 404 });
    // }

    const deletedGoLink = await prisma.goLinks.delete({ where: { id } });

    console.log(`Successfully deleted GoLink ID: ${id}`, deletedGoLink);
    return NextResponse.json(deletedGoLink, { status: 200 }); // Or 204 No Content without body

  } catch (error: any) {
    console.error(`!!! ERROR Deleting GoLink ID ${id} !!!`);
    console.error("Error Code:", error.code);
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    console.error("Stack Trace:", error.stack);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record to delete not found
      if (error.code === 'P2025') {
        return new Response(`GoLink with ID ${id} not found.`, { status: 404 });
      }
      // Add other specific Prisma error codes if needed
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

  // --- Parse Request Body ---
  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return new Response("Invalid JSON payload", { status: 400 });
  }

  // --- Validation Check: ID ---
  if (!("id" in body) || typeof body.id !== 'number') {
    return new Response("A numeric `id` must be included in the request body", {
      status: 400,
    });
  }
  const id = body.id;

  // --- Prepare Update Data ---
  // Use Prisma type for better safety if possible, requires schema knowledge
  const data: Prisma.GoLinksUpdateInput = {};
  let hasUpdates = false; // Track if any fields are actually being updated

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

  // Optional: Check if there are any fields to update
  if (!hasUpdates) {
     return new Response("No update fields provided in the request body.", { status: 400 });
  }

  // --- Database Operation: Update ---
  try {
    console.log(`Attempting to update GoLink ID: ${id} with data:`, data);

    // Add updatedAt manually or let Prisma handle it via @updatedAt
    data.updatedAt = new Date(); // Example if you need manual update timestamp

    const updatedGolink = await prisma.goLinks.update({
       where: { id },
       data
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
      // P2025: Record to update not found
      if (error.code === 'P2025') {
        return new Response(`GoLink with ID ${id} not found.`, { status: 404 });
      }
      // P2002: Unique constraint failed (e.g., updating golink slug to one that already exists)
      if (error.code === 'P2002' && error.meta?.target) {
          const targetField = Array.isArray(error.meta.target) ? error.meta.target[0] : error.meta.target;
          const failedValue = body[targetField] ?? '[unknown value]';
           console.log(`Unique constraint violation on field during update: ${targetField}`);
           return new Response(`The ${targetField} '${failedValue}' already exists.`, { status: 409 }); // 409 Conflict
      }
      // Add other specific Prisma error codes if needed
    }

    // Log the raw error only on the server, return generic message to client
    return new Response("Failed to update GoLink due to a server error.", { status: 500 });
  }
}
