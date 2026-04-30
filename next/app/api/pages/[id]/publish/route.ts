import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { getPageById, publishPage } from "@/lib/services/pageService";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pages/[id]/publish
 *
 * Validates draft content against the latest schema, hashes it, and
 * (if changed) snapshots it to PageVersion + flips the page to
 * PUBLISHED. Returns `{ noop: true }` if the draft equals the latest
 * published version. Officer-gated; system-locked pages reject.
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Officer required" }, { status: 403 });
  }
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      { error: "System-locked pages cannot be published from the page builder." },
      { status: 403 }
    );
  }
  if (existing.status === "ARCHIVED") {
    return NextResponse.json(
      { error: "Restore the page from trash before publishing." },
      { status: 400 }
    );
  }

  try {
    const result = await publishPage({ id, publishedById: auth.userId });
    revalidatePath(`/${result.page.slug}`);
    revalidatePath("/dashboard/pages");
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
