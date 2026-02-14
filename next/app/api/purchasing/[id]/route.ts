import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic'

/**
 * GET /api/purchasing/[id] - Get a single purchase request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return new Response("Invalid ID", { status: 400 });
  }

  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!purchaseRequest) {
      return new Response("Purchase request not found", { status: 404 });
    }

    return Response.json(purchaseRequest);
  } catch (error) {
    console.error("GET /api/purchasing/[id] error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}

/**
 * PUT /api/purchasing/[id] - Update a purchase request (e.g., submit receipt)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return new Response("Invalid ID", { status: 400 });
  }

  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check if the purchase request exists
  const existingRequest = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
  });

  if (!existingRequest) {
    return new Response("Purchase request not found", { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // Build the update data object
  const updateData: {
    status?: string;
    actualCost?: number;
    receiptImage?: string | null;
    receiptEmail?: string;
    eventName?: string | null;
    eventDate?: Date | null;
    attendanceData?: string | null;
    attendanceImage?: string | null;
  } = {};

  // Validate and set optional fields
  if ("status" in body) {
    if (typeof body.status !== "string") {
      return new Response("'status' must be a string", { status: 422 });
    }
    const validStatuses = ["pending", "checked_out", "returned"];
    if (!validStatuses.includes(body.status)) {
      return new Response(`'status' must be one of: ${validStatuses.join(", ")}`, { status: 422 });
    }
    updateData.status = body.status;
  }

  if ("actualCost" in body) {
    if (typeof body.actualCost !== "number" && typeof body.actualCost !== "string") {
      return new Response("'actualCost' must be a number", { status: 422 });
    }
    updateData.actualCost = parseFloat(body.actualCost);
  }

  if ("receiptImage" in body) {
    if (typeof body.receiptImage !== "string") {
      return new Response("'receiptImage' must be a string (base64)", { status: 422 });
    }
    updateData.receiptImage = body.receiptImage;
  }

  if ("receiptEmail" in body) {
    if (typeof body.receiptEmail !== "string") {
      return new Response("'receiptEmail' must be a string", { status: 422 });
    }
    // Allow empty string (no additional recipient) or a valid email
    if (body.receiptEmail !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.receiptEmail)) {
        return new Response("'receiptEmail' must be a valid email address", { status: 422 });
      }
    }
    updateData.receiptEmail = body.receiptEmail;
  }

  if ("eventName" in body) {
    if (body.eventName !== null && typeof body.eventName !== "string") {
      return new Response("'eventName' must be a string or null", { status: 422 });
    }
    updateData.eventName = body.eventName;
  }

  if ("eventDate" in body) {
    if (body.eventDate !== null && typeof body.eventDate !== "string") {
      return new Response("'eventDate' must be a string (ISO date) or null", { status: 422 });
    }
    updateData.eventDate = body.eventDate ? new Date(body.eventDate) : null;
  }

  if ("attendanceData" in body) {
    if (body.attendanceData !== null && typeof body.attendanceData !== "string") {
      return new Response("'attendanceData' must be a JSON string or null", { status: 422 });
    }
    updateData.attendanceData = body.attendanceData;
  }

  if ("attendanceImage" in body) {
    if (body.attendanceImage !== null && typeof body.attendanceImage !== "string") {
      return new Response("'attendanceImage' must be a string (base64) or null", { status: 422 });
    }
    updateData.attendanceImage = body.attendanceImage;
  }

  try {
    const purchaseRequest = await prisma.purchaseRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });
    return Response.json(purchaseRequest);
  } catch (error) {
    console.error("PUT /api/purchasing/[id] error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}

/**
 * DELETE /api/purchasing/[id] - Delete a purchase request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return new Response("Invalid ID", { status: 400 });
  }

  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check if the purchase request exists
  const existingRequest = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
  });

  if (!existingRequest) {
    return new Response("Purchase request not found", { status: 404 });
  }

  try {
    const purchaseRequest = await prisma.purchaseRequest.delete({
      where: { id: requestId },
    });
    return Response.json(purchaseRequest);
  } catch (error) {
    console.error("DELETE /api/purchasing/[id] error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}
