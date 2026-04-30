import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { UpdatePhotoCategorySchema } from "@/lib/schemas/photoCategory";
import {
  PhotoCategoryBuiltInError,
  PhotoCategoryDeleteBlockedError,
  deletePhotoCategory,
  updatePhotoCategory,
} from "@/lib/services/photoCategoryService";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/photo-categories/[id]
 *
 * Officer-only. Renames or otherwise updates a category. Slug renames
 * cascade through Photo.category via the FK's ON UPDATE CASCADE.
 */
export async function PUT(request: NextRequest, ctx: RouteContext) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Officer required" }, { status: 403 });
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
  const parsed = UpdatePhotoCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    const category = await updatePhotoCategory({
      id,
      slug: parsed.data.slug,
      label: parsed.data.label,
      description: parsed.data.description ?? undefined,
      sortOrder: parsed.data.sortOrder,
    });
    return NextResponse.json({ category });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    if (message.includes("Unique")) {
      return NextResponse.json(
        { error: `A category with that slug already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/photo-categories/[id]
 *
 * Primary-officer-only. Built-in categories reject. Pass
 * `?reassignTo=otherSlug` to move photos before deleting.
 */
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
  const reassignTo = request.nextUrl.searchParams.get("reassignTo") ?? undefined;
  try {
    await deletePhotoCategory({ id, reassignTo });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof PhotoCategoryBuiltInError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof PhotoCategoryDeleteBlockedError) {
      return NextResponse.json(
        {
          error: err.message,
          photoCount: err.photoCount,
          hint: "Pass ?reassignTo=otherSlug or merge first.",
        },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
