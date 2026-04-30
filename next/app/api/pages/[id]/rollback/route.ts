import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { rollbackToVersion } from "@/lib/services/pageService";
import { RollbackPageSchema } from "@/lib/schemas/page";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pages/[id]/rollback
 *
 * Officer-only. Copies the chosen version's content into draftContent.
 * Does NOT auto-publish — the editor must click Publish to broadcast it.
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = RollbackPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    const page = await rollbackToVersion({
      pageId: id,
      versionId: parsed.data.versionId,
    });
    return NextResponse.json({ page });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rollback failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
