import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/announcement
 * Returns active announcements by default.
 * Pass ?all=true to get every announcement (officer-only for dashboard).
 */
export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get("all") === "true";

  const announcements = await prisma.announcement.findMany({
    where: showAll ? {} : { active: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(announcements);
}

/**
 * POST /api/announcement
 * Create a new announcement. Requires officer auth.
 * Body: { message: string, category?: string }
 */
export async function POST(request: NextRequest) {
  const authToken = getSessionToken(request);
  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify the user is an officer
  const user = await prisma.user.findFirst({
    where: {
      session: { some: { sessionToken: authToken } },
      officers: { some: { is_active: true } },
    },
  });
  if (!user) {
    return new Response("Forbidden – officers only", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!body.message?.trim()) {
    return new Response('"message" is required', { status: 422 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      message: body.message.trim(),
      category: body.category?.trim() || null,
      active: body.active ?? true,
    },
  });

  return Response.json(announcement, { status: 201 });
}

/**
 * PUT /api/announcement
 * Update an existing announcement. Requires officer auth.
 * Body: { id: number, message?: string, category?: string, active?: boolean }
 */
export async function PUT(request: NextRequest) {
  const authToken = getSessionToken(request);
  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      session: { some: { sessionToken: authToken } },
      officers: { some: { is_active: true } },
    },
  });
  if (!user) {
    return new Response("Forbidden – officers only", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (typeof body.id !== "number") {
    return new Response('"id" (number) is required', { status: 422 });
  }

  const data: { message?: string; category?: string | null; active?: boolean } = {};
  if (body.message !== undefined) data.message = body.message.trim();
  if (body.category !== undefined) data.category = body.category?.trim() || null;
  if (body.active !== undefined) data.active = body.active;

  try {
    const updated = await prisma.announcement.update({
      where: { id: body.id },
      data,
    });
    return Response.json(updated);
  } catch {
    return new Response("Announcement not found", { status: 404 });
  }
}

/**
 * DELETE /api/announcement
 * Delete an announcement. Requires officer auth.
 * Body: { id: number }
 */
export async function DELETE(request: NextRequest) {
  const authToken = getSessionToken(request);
  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      session: { some: { sessionToken: authToken } },
      officers: { some: { is_active: true } },
    },
  });
  if (!user) {
    return new Response("Forbidden – officers only", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (typeof body.id !== "number") {
    return new Response('"id" (number) is required', { status: 422 });
  }

  try {
    const deleted = await prisma.announcement.delete({ where: { id: body.id } });
    return Response.json(deleted);
  } catch {
    return new Response("Announcement not found", { status: 404 });
  }
}
