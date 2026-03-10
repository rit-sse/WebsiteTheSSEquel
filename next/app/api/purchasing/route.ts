import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest } from "next/server";
import { CreatePurchaseRequestSchema } from "@/lib/schemas/purchasing";
import { ApiError } from "@/lib/apiError";

export const dynamic = 'force-dynamic'

/**
 * GET /api/purchasing - List all purchase requests (visible to all officers)
 */
export async function GET(request: NextRequest) {
  const authToken = getSessionToken(request);

  if (!authToken) {
    return ApiError.unauthorized();
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
    return ApiError.notFound("User");
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
    return ApiError.internal();
  }
}

/**
 * POST /api/purchasing - Create a new purchase request
 */
export async function POST(request: NextRequest) {
  const authToken = getSessionToken(request);

  if (!authToken) {
    return ApiError.unauthorized();
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
    return ApiError.notFound("User");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = CreatePurchaseRequestSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { name, committee, description, estimatedCost, plannedDate, notifyEmail, eventId } = parsed.data;

  try {
    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        userId: user.id,
        name,
        committee,
        description,
        estimatedCost,
        plannedDate: new Date(plannedDate),
        notifyEmail,
        status: "pending",
        eventId: eventId || null,
      },
    });
    return Response.json(purchaseRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/purchasing error:", error);
    return ApiError.internal();
  }
}
