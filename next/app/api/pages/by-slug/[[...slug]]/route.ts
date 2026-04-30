import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { getPageDraftBySlug, getPagePublic } from "@/lib/services/pageService";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug?: string[] }>;
}

/**
 * GET /api/pages/by-slug/<slug-segments>
 *
 * Public route returning the *published* page for the slug. Officers
 * can pass `?preview=1` to get the draft instead.
 *
 * Used by the catch-all (`/[...slug]`) and by the dashboard preview iframe.
 */
export async function GET(request: NextRequest, ctx: RouteContext) {
  const { slug: slugParts = [] } = await ctx.params;
  const slug = slugParts.join("/");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const isPreview = request.nextUrl.searchParams.get("preview") === "1";
  if (isPreview) {
    const auth = await resolveAuthLevelFromRequest(request);
    if (!auth.isOfficer && !auth.isSeAdmin) {
      return NextResponse.json({ error: "Officer required" }, { status: 403 });
    }
    const page = await getPageDraftBySlug(slug);
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ page, mode: "preview" });
  }

  const page = await getPagePublic(slug);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (page.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ page, mode: "public" });
}
