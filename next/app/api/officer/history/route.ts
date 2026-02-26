import prisma from "@/lib/prisma";
import { resolveUserImage } from "@/lib/s3Utils";
import { groupBySemester } from "@/lib/semester";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/officer/history
 * Returns all non-active officers grouped by semester (most recent first).
 * Each semester entry contains primary officers and committee heads.
 */
export async function GET() {
  const officers = await prisma.officer.findMany({
    where: { is_active: false },
    select: {
      id: true,
      start_date: true,
      end_date: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          linkedIn: true,
          gitHub: true,
          description: true,
          profileImageKey: true,
          googleImageURL: true,
        },
      },
      position: {
        select: {
          id: true,
          title: true,
          is_primary: true,
          is_defunct: true,
        },
      },
    },
    orderBy: { start_date: "desc" },
  });

  // Group by semester using the shared utility — exclude Summer terms
  const semesterGroups = groupBySemester(officers, (o) => o.start_date.toISOString())
    .filter(({ label }) => !label.startsWith("Summer"));

  const years = semesterGroups.map(({ label, items }) => {
    const primary_officers = items
      .filter((o) => o.position.is_primary)
      .map((o) => ({
        ...o,
        user: {
          ...o.user,
          image: resolveUserImage(o.user.profileImageKey, o.user.googleImageURL),
        },
      }));

    const committee_heads = items
      .filter((o) => !o.position.is_primary)
      .sort((a, b) => a.position.title.localeCompare(b.position.title))
      .map((o) => ({
        ...o,
        user: {
          ...o.user,
          image: resolveUserImage(o.user.profileImageKey, o.user.googleImageURL),
        },
      }));

    return { year: label, primary_officers, committee_heads };
  });

  return Response.json(years);
}

/**
 * POST /api/officer/history
 * Manually add a historical (inactive) officer record.
 * Body: { email, name?, position_title, start_date, end_date }
 * Requires officer auth.
 */
export async function POST(req: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(req);
  if (!auth.isOfficer) return new Response("Officers only", { status: 403 });

  let body: { email: string; name?: string; position_title: string; start_date: string; end_date: string };
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const { email, name, position_title, start_date, end_date } = body;
  if (!email || !position_title || !start_date || !end_date) {
    return new Response("email, position_title, start_date, and end_date are required", { status: 400 });
  }

  const position = await prisma.officerPosition.findUnique({ where: { title: position_title } });
  if (!position) return new Response(`Position "${position_title}" not found`, { status: 404 });

  // Upsert the user — keep any existing data, only fill name if not present
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: name ?? email.split("@")[0], isImported: true },
  });

  const officer = await prisma.officer.create({
    data: {
      user_id: user.id,
      position_id: position.id,
      is_active: false,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    },
    select: {
      id: true,
      start_date: true,
      end_date: true,
      user: { select: { id: true, name: true, email: true, profileImageKey: true, googleImageURL: true } },
      position: { select: { id: true, title: true, is_primary: true, is_defunct: true } },
    },
  });

  return Response.json({
    ...officer,
    user: { ...officer.user, image: resolveUserImage(officer.user.profileImageKey, officer.user.googleImageURL) },
  });
}

/**
 * PUT /api/officer/history
 * Update a historical officer's dates.
 * Body: { id, start_date?, end_date? }
 * Requires officer auth.
 */
export async function PUT(req: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(req);
  if (!auth.isOfficer) return new Response("Officers only", { status: 403 });

  let body: { id: number; start_date?: string; end_date?: string };
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  if (!body.id) return new Response("id is required", { status: 400 });

  const data: { start_date?: Date; end_date?: Date } = {};
  if (body.start_date) data.start_date = new Date(body.start_date);
  if (body.end_date) data.end_date = new Date(body.end_date);

  try {
    const officer = await prisma.officer.update({
      where: { id: body.id, is_active: false },
      data,
    });
    return Response.json(officer);
  } catch {
    return new Response("Historical officer not found", { status: 404 });
  }
}

/**
 * DELETE /api/officer/history?id=123
 * Delete a historical officer record.
 * Requires officer auth.
 */
export async function DELETE(req: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(req);
  if (!auth.isOfficer) return new Response("Officers only", { status: 403 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return new Response("id query param is required", { status: 400 });

  try {
    await prisma.officer.delete({ where: { id, is_active: false } });
    return new Response(null, { status: 204 });
  } catch {
    return new Response("Historical officer not found", { status: 404 });
  }
}
