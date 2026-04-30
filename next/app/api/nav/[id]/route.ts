import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { UpdateNavItemSchema } from "@/lib/schemas/navItem";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PUT /api/nav/[id] — Primary-officer-only. */
export async function PUT(request: NextRequest, ctx: RouteContext) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isPrimary && !auth.isSeAdmin) {
    return NextResponse.json(
      { error: "Primary officers only" },
      { status: 403 }
    );
  }
  const { id: idStr } = await ctx.params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = UpdateNavItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const item = await prisma.navItem.update({
    where: { id },
    data: {
      label: parsed.data.label,
      href: parsed.data.href,
      description: parsed.data.description ?? undefined,
      parentId: parsed.data.parentId ?? undefined,
      sortOrder: parsed.data.sortOrder,
      isVisible: parsed.data.isVisible,
      alignment: parsed.data.alignment ?? undefined,
    },
  });
  return NextResponse.json({ item });
}

/** DELETE /api/nav/[id] — cascades to children. */
export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isPrimary && !auth.isSeAdmin) {
    return NextResponse.json(
      { error: "Primary officers only" },
      { status: 403 }
    );
  }
  const { id: idStr } = await ctx.params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await prisma.navItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
