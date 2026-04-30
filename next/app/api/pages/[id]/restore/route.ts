import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { getPageById, restorePage } from "@/lib/services/pageService";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pages/[id]/restore
 *
 * Primary-officer-only. Pulls an ARCHIVED page back to DRAFT.
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
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
  const existing = await getPageById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "ARCHIVED") {
    return NextResponse.json(
      { error: "Page is not archived." },
      { status: 400 }
    );
  }
  const restored = await restorePage(id);
  revalidatePath(`/${restored.slug}`);
  revalidatePath("/dashboard/pages");
  return NextResponse.json({ page: restored });
}
