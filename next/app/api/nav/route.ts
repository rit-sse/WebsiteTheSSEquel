import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { CreateNavItemSchema } from "@/lib/schemas/navItem";
import { getNavTree, getNavTreeAdmin } from "@/lib/services/navService";

export const dynamic = "force-dynamic";

/**
 * GET /api/nav
 *
 * Returns the visible nav tree. `?admin=1` returns hidden items too
 * (officer-gated).
 */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("admin") === "1") {
    const auth = await resolveAuthLevelFromRequest(request);
    if (!auth.isOfficer && !auth.isSeAdmin) {
      return NextResponse.json({ error: "Officer required" }, { status: 403 });
    }
    return NextResponse.json({ items: await getNavTreeAdmin() });
  }
  return NextResponse.json({ items: await getNavTree() });
}

/**
 * POST /api/nav
 *
 * Primary-officer-only. Creates a NavItem.
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
  const parsed = CreateNavItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const item = await prisma.navItem.create({
    data: {
      label: parsed.data.label,
      href: parsed.data.href,
      description: parsed.data.description ?? null,
      parentId: parsed.data.parentId ?? null,
      sortOrder: parsed.data.sortOrder ?? 100,
      alignment: parsed.data.alignment ?? null,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
