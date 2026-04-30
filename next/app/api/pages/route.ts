import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { CreatePageSchema } from "@/lib/schemas/page";
import { validateSlug } from "@/lib/pageBuilder/blocks";
import {
  createPage,
  listPagesForDashboard,
} from "@/lib/services/pageService";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * GET /api/pages
 *
 * Officer-only: returns the dashboard list with statuses.
 * `?includeArchived=true` includes trashed pages.
 */
export async function GET(request: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Officer required" }, { status: 403 });
  }
  const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";
  const pages = await listPagesForDashboard({ includeArchived });
  return NextResponse.json({ pages });
}

/**
 * POST /api/pages
 *
 * Primary-officer-only: creates a new draft page.
 */
export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreatePageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const slugCheck = validateSlug(parsed.data.slug);
  if (!slugCheck.ok) {
    return NextResponse.json({ error: slugCheck.error }, { status: 400 });
  }

  try {
    const page = await createPage({
      slug: slugCheck.slug,
      title: parsed.data.title,
      createdById: auth.userId,
      navSection: parsed.data.navSection,
      showInNav: parsed.data.showInNav,
      navLabel: parsed.data.navLabel,
      navOrder: parsed.data.navOrder,
    });
    // The dashboard list cache will pick this up next request.
    revalidatePath("/dashboard/pages");
    return NextResponse.json({ page }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create page";
    if (message.includes("Unique constraint") || message.includes("slug")) {
      return NextResponse.json(
        { error: `A page with slug "${slugCheck.slug}" already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
