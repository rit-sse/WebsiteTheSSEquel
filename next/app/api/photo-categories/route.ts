import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import {
  CreatePhotoCategorySchema,
} from "@/lib/schemas/photoCategory";
import {
  createPhotoCategory,
  listPhotoCategoriesWithCounts,
} from "@/lib/services/photoCategoryService";

export const dynamic = "force-dynamic";

/**
 * GET /api/photo-categories
 *
 * Public list of photo categories with their photo counts. Used by
 * carousel/grid block editors and by anyone who wants to filter photos.
 */
export async function GET() {
  const categories = await listPhotoCategoriesWithCounts();
  return NextResponse.json({ categories });
}

/**
 * POST /api/photo-categories
 *
 * Officer-only. Creates a new (non-built-in) category.
 */
export async function POST(request: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Officer required" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CreatePhotoCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    const category = await createPhotoCategory(parsed.data);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    if (message.includes("Unique") || message.includes("slug")) {
      return NextResponse.json(
        { error: `A category with slug "${parsed.data.slug}" already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
