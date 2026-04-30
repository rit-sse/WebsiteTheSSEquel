import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { UpdatePageSchema } from "@/lib/schemas/page";
import { validateSlug } from "@/lib/pageBuilder/blocks";
import {
  archivePage,
  ConcurrentEditError,
  getPageById,
  updatePage,
} from "@/lib/services/pageService";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(idStr: string): number | null {
  const id = Number.parseInt(idStr, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** GET /api/pages/[id] — Officer-only. Full page record. */
export async function GET(request: NextRequest, ctx: RouteContext) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Officer required" }, { status: 403 });
  }
  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ page });
}

/**
 * PUT /api/pages/[id]
 *
 * Officer can update title, draftContent, SEO, nav settings.
 * Primary-officer is required for slug changes and toggling systemLocked.
 */
export async function PUT(request: NextRequest, ctx: RouteContext) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Officer required" }, { status: 403 });
  }

  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdatePageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Block edits to system-locked pages from this endpoint. Even officers
  // who could otherwise edit content can't override the constitution
  // through the page builder.
  const existing = await getPageById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.systemLocked) {
    // Allow toggling systemLocked off (primary only) but nothing else.
    const onlyLockToggle = Object.keys(parsed.data).every(
      (k) => k === "systemLocked" || k === "expectedUpdatedAt"
    );
    if (!onlyLockToggle) {
      return NextResponse.json(
        { error: "This page is system-locked and cannot be edited from the page builder." },
        { status: 403 }
      );
    }
  }

  // Slug + systemLocked CHANGES require primary officer. We compare to
  // the existing values so the editor's autosave (which always sends
  // the full settings object) doesn't trigger a 403 on every save.
  const slugChanging = parsed.data.slug !== undefined && parsed.data.slug !== existing.slug;
  const lockChanging =
    parsed.data.systemLocked !== undefined &&
    parsed.data.systemLocked !== existing.systemLocked;
  if ((slugChanging || lockChanging) && !auth.isPrimary && !auth.isSeAdmin) {
    return NextResponse.json(
      { error: "Slug and system-lock changes require a primary officer." },
      { status: 403 }
    );
  }

  // Validate slug shape.
  let nextSlug: string | undefined;
  if (parsed.data.slug !== undefined) {
    const sc = validateSlug(parsed.data.slug);
    if (!sc.ok) return NextResponse.json({ error: sc.error }, { status: 400 });
    nextSlug = sc.slug;
  }

  try {
    const updated = await updatePage({
      id,
      title: parsed.data.title,
      slug: nextSlug,
      systemLocked: parsed.data.systemLocked,
      draftContent: parsed.data.draftContent,
      seoTitle: parsed.data.seoTitle ?? undefined,
      seoDescription: parsed.data.seoDescription ?? undefined,
      showInNav: parsed.data.showInNav,
      navSection: parsed.data.navSection,
      navLabel: parsed.data.navLabel ?? undefined,
      navOrder: parsed.data.navOrder,
      expectedUpdatedAt: parsed.data.expectedUpdatedAt
        ? new Date(parsed.data.expectedUpdatedAt)
        : undefined,
    });
    // Bust the public ISR cache for the page if its slug or content
    // changed (it might be already-published, in which case anonymous
    // visitors should get the latest).
    if (updated.status === "PUBLISHED") {
      revalidatePath(`/${updated.slug}`);
    }
    return NextResponse.json({ page: updated });
  } catch (err) {
    if (err instanceof ConcurrentEditError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Update failed";
    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: `A page with that slug already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/pages/[id]
 *
 * Primary-officer-only. Soft-delete: marks ARCHIVED, keeps the row.
 */
export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isPrimary && !auth.isSeAdmin) {
    return NextResponse.json(
      { error: "Primary officers only" },
      { status: 403 }
    );
  }
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await getPageById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.systemLocked) {
    return NextResponse.json(
      { error: "System-locked pages cannot be deleted from the page builder." },
      { status: 403 }
    );
  }

  const archived = await archivePage({ id, archivedById: auth.userId });
  // Force public traffic to re-fetch and see the 410.
  revalidatePath(`/${archived.slug}`);
  revalidatePath("/dashboard/pages");
  return NextResponse.json({ page: archived });
}
