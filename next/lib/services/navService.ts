/**
 * Navigation tree management.
 *
 * The hardcoded NavItem arrays in `components/nav/Navbar.tsx` will be
 * seeded into this table by the migration when the nav editor ships
 * (Phase 3). Until then, this service provides the read API but the
 * navbar will gracefully fall back to an empty tree (Navbar.tsx still
 * keeps its const arrays as a safety net).
 */
import "server-only";
import prisma from "@/lib/prisma";

export interface NavTreeItem {
  id: number;
  label: string;
  href: string;
  description: string | null;
  alignment: string | null;
  isVisible: boolean;
  children: NavTreeItem[];
}

/** Build the visible top-level nav tree. */
export async function getNavTree(): Promise<NavTreeItem[]> {
  const items = await prisma.navItem.findMany({
    where: { isVisible: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });
  const byParent = new Map<number | null, typeof items>();
  for (const item of items) {
    const arr = byParent.get(item.parentId) ?? [];
    arr.push(item);
    byParent.set(item.parentId, arr);
  }
  function build(parentId: number | null): NavTreeItem[] {
    return (byParent.get(parentId) ?? []).map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      description: item.description,
      alignment: item.alignment,
      isVisible: item.isVisible,
      children: build(item.id),
    }));
  }
  return build(null);
}

/** Same as getNavTree but includes hidden items (officer admin view). */
export async function getNavTreeAdmin(): Promise<NavTreeItem[]> {
  const items = await prisma.navItem.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });
  const byParent = new Map<number | null, typeof items>();
  for (const item of items) {
    const arr = byParent.get(item.parentId) ?? [];
    arr.push(item);
    byParent.set(item.parentId, arr);
  }
  function build(parentId: number | null): NavTreeItem[] {
    return (byParent.get(parentId) ?? []).map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      description: item.description,
      alignment: item.alignment,
      isVisible: item.isVisible,
      children: build(item.id),
    }));
  }
  return build(null);
}
