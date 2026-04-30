import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { getPageById, unpublishPage } from "@/lib/services/pageService";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pages/[id]/unpublish
 *
 * Flip a published page back to DRAFT. publishedContent is preserved
 * for restoration but the public catch-all stops serving it.
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Officer required" }, { status: 403 });
  }
  const { id: idStr } = await ctx.params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const existing = await getPageById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.systemLocked) {
    return NextResponse.json(
      { error: "System-locked pages cannot be unpublished." },
      { status: 403 }
    );
  }

  const updated = await unpublishPage(id);
  revalidatePath(`/${updated.slug}`);
  revalidatePath("/dashboard/pages");
  return NextResponse.json({ page: updated });
}
