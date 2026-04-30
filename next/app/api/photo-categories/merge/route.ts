import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { MergePhotoCategoriesSchema } from "@/lib/schemas/photoCategory";
import { mergePhotoCategories } from "@/lib/services/photoCategoryService";

export const dynamic = "force-dynamic";

/**
 * POST /api/photo-categories/merge
 *
 * Primary-officer-only. Bulk-moves all photos from `fromSlug` to
 * `intoSlug`, then deletes `fromSlug`. Built-in categories cannot be
 * the source.
 */
export async function POST(request: NextRequest) {
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
  const parsed = MergePhotoCategoriesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    await mergePhotoCategories(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Merge failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
