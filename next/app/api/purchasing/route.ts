import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic'

/**
 * GET /api/purchasing - List all purchase requests (visible to all officers)
 */
export async function GET(request: NextRequest) {
  const authToken = getSessionToken(request);

  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify user exists
  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken: authToken,
        },
      },
    },
    select: { id: true },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  try {
    // Return ALL purchase requests for officers to view
    const requests = await prisma.purchaseRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            attendanceEnabled: true,
          },
        },
      },
    });
    return Response.json(requests);
  } catch (error) {
    console.error("GET /api/purchasing error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}

/**
 * POST /api/purchasing - Create a new purchase request
 */
export async function POST(request: NextRequest) {
  const authToken = getSessionToken(request);

  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get the user from the session token
  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken: authToken,
        },
      },
    },
    select: { id: true },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // Validate required fields
  const requiredFields = ["name", "committee", "description", "estimatedCost", "plannedDate", "notifyEmail"];
  for (const field of requiredFields) {
    if (!(field in body)) {
      return new Response(`'${field}' must be included in the body`, { status: 400 });
    }
  }

  // Validate field types
  if (typeof body.name !== "string") {
    return new Response("'name' must be a string", { status: 422 });
  }
  if (typeof body.committee !== "string") {
    return new Response("'committee' must be a string", { status: 422 });
  }
  if (typeof body.description !== "string") {
    return new Response("'description' must be a string", { status: 422 });
  }
  if (typeof body.estimatedCost !== "number" && typeof body.estimatedCost !== "string") {
    return new Response("'estimatedCost' must be a number", { status: 422 });
  }
  if (typeof body.plannedDate !== "string") {
    return new Response("'plannedDate' must be a string (ISO date)", { status: 422 });
  }
  if (typeof body.notifyEmail !== "string") {
    return new Response("'notifyEmail' must be a string", { status: 422 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.notifyEmail)) {
    return new Response("'notifyEmail' must be a valid email address", { status: 422 });
  }

  try {
    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        userId: user.id,
        name: body.name,
        committee: body.committee,
        description: body.description,
        estimatedCost: parseFloat(body.estimatedCost),
        plannedDate: new Date(body.plannedDate),
        notifyEmail: body.notifyEmail,
        status: "pending",
        eventId: body.eventId || null,
      },
    });
    return Response.json(purchaseRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/purchasing error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}
