import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { ReorderNavItemsSchema } from "@/lib/schemas/navItem";

export const dynamic = "force-dynamic";

/**
 * PUT /api/nav/reorder
 *
 * Bulk-update parentId + sortOrder for many items in one transaction.
 * The dashboard nav editor uses this after a drag-reorder.
 */
export async function PUT(request: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isPrimary && !auth.isSeAdmin) {
    return NextResponse.json(
      { error: "Primary officers only" },
      { status: 403 }
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ReorderNavItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  await prisma.$transaction(
    parsed.data.items.map((it) =>
      prisma.navItem.update({
        where: { id: it.id },
        data: { parentId: it.parentId, sortOrder: it.sortOrder },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
