import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ positionId: string }>;
}

/**
 * HTTP GET request to /api/handover/[positionId]
 * Gets the handover document for a position
 * Creates an empty document if one doesn't exist
 * @returns { id: number, positionId: number, content: string, updatedAt: string, position: { title: string } }
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { positionId } = await params;
  const positionIdNum = parseInt(positionId, 10);

  if (isNaN(positionIdNum)) {
    return new Response("Invalid position ID", { status: 400 });
  }

  try {
    // Check if position exists
    const position = await prisma.officerPosition.findUnique({
      where: { id: positionIdNum },
      select: { id: true, title: true }
    });

    if (!position) {
      return new Response("Position not found", { status: 404 });
    }

    // Get or create the handover document
    let handoverDoc = await prisma.handoverDocument.findUnique({
      where: { positionId: positionIdNum },
      include: {
        position: {
          select: { title: true, is_primary: true }
        }
      }
    });

    // If no document exists, create an empty one
    if (!handoverDoc) {
      handoverDoc = await prisma.handoverDocument.create({
        data: {
          positionId: positionIdNum,
          content: `# ${position.title} Handover Document\n\nWelcome to the ${position.title} role! This document contains important information for your position.\n\n## Responsibilities\n\n- Add your responsibilities here\n\n## Key Contacts\n\n- Add important contacts here\n\n## Resources\n\n- Add useful links and resources here\n\n## Notes for Your Successor\n\n- Add any notes for the next person in this role\n`
        },
        include: {
          position: {
            select: { title: true, is_primary: true }
          }
        }
      });
    }

    return Response.json(handoverDoc);
  } catch (e) {
    console.error("Error fetching handover document:", e);
    return new Response(`Failed to fetch handover document: ${e}`, { status: 500 });
  }
}

/**
 * HTTP PUT request to /api/handover/[positionId]
 * Updates the handover document content for a position
 * @param request { content: string }
 * @returns updated handover document
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const { positionId } = await params;
  const positionIdNum = parseInt(positionId, 10);

  if (isNaN(positionIdNum)) {
    return new Response("Invalid position ID", { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!("content" in body) || typeof body.content !== "string") {
    return new Response('"content" (string) is required', { status: 400 });
  }

  const { content } = body;

  try {
    // Check if position exists
    const position = await prisma.officerPosition.findUnique({
      where: { id: positionIdNum },
      select: { id: true, title: true }
    });

    if (!position) {
      return new Response("Position not found", { status: 404 });
    }

    // Upsert the handover document
    const handoverDoc = await prisma.handoverDocument.upsert({
      where: { positionId: positionIdNum },
      update: { content },
      create: {
        positionId: positionIdNum,
        content
      },
      include: {
        position: {
          select: { title: true, is_primary: true }
        }
      }
    });

    return Response.json(handoverDoc);
  } catch (e) {
    console.error("Error updating handover document:", e);
    return new Response(`Failed to update handover document: ${e}`, { status: 500 });
  }
}
