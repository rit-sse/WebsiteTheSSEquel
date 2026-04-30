/**
 * Photo category management.
 *
 * Categories are stored in `PhotoCategory` and referenced by
 * `Photo.category` via FK with ON UPDATE CASCADE — renaming a slug
 * propagates with one SQL statement, no app-level backfill.
 *
 * Built-in categories (the historical 6) cannot be deleted, only
 * renamed. Non-builtin categories can be deleted IF they have no
 * photos referencing them, OR merged into another category which
 * bulk-updates Photo.category and then drops the source row.
 */
import "server-only";
import prisma from "@/lib/prisma";

export interface PhotoCategoryWithCount {
  id: number;
  slug: string;
  label: string;
  description: string | null;
  isBuiltIn: boolean;
  sortOrder: number;
  photoCount: number;
}

export async function listPhotoCategoriesWithCounts(): Promise<PhotoCategoryWithCount[]> {
  const [cats, counts] = await Promise.all([
    prisma.photoCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    }),
    prisma.photo.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(counts.map((c) => [c.category, c._count._all]));
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    label: c.label,
    description: c.description,
    isBuiltIn: c.isBuiltIn,
    sortOrder: c.sortOrder,
    photoCount: countMap.get(c.slug) ?? 0,
  }));
}

export async function listPhotoCategoriesBasic() {
  return prisma.photoCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    select: { slug: true, label: true, description: true, isBuiltIn: true },
  });
}

export async function getPhotoCategoryBySlug(slug: string) {
  return prisma.photoCategory.findUnique({ where: { slug } });
}

export async function createPhotoCategory(input: {
  slug: string;
  label: string;
  description?: string;
  sortOrder?: number;
}) {
  return prisma.photoCategory.create({
    data: {
      slug: input.slug,
      label: input.label,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 100,
      isBuiltIn: false,
    },
  });
}

export async function updatePhotoCategory(opts: {
  id: number;
  slug?: string;
  label?: string;
  description?: string | null;
  sortOrder?: number;
}) {
  return prisma.photoCategory.update({
    where: { id: opts.id },
    data: {
      slug: opts.slug,
      label: opts.label,
      description: opts.description,
      sortOrder: opts.sortOrder,
    },
  });
}

export class PhotoCategoryDeleteBlockedError extends Error {
  constructor(public photoCount: number) {
    super(`Cannot delete category — ${photoCount} photos still reference it.`);
    this.name = "PhotoCategoryDeleteBlockedError";
  }
}

export class PhotoCategoryBuiltInError extends Error {
  constructor() {
    super("Built-in categories cannot be deleted, only renamed.");
    this.name = "PhotoCategoryBuiltInError";
  }
}

/**
 * Delete a category. If `reassignTo` is supplied, photos are moved
 * there first; otherwise the call fails when photos still reference it.
 * Built-in categories can never be deleted.
 */
export async function deletePhotoCategory(opts: {
  id: number;
  reassignTo?: string;
}) {
  const cat = await prisma.photoCategory.findUnique({ where: { id: opts.id } });
  if (!cat) throw new Error("Category not found");
  if (cat.isBuiltIn) throw new PhotoCategoryBuiltInError();

  if (opts.reassignTo) {
    if (opts.reassignTo === cat.slug) {
      throw new Error("Cannot reassign to itself");
    }
    const target = await prisma.photoCategory.findUnique({
      where: { slug: opts.reassignTo },
    });
    if (!target) throw new Error("Target category not found");
    await prisma.$transaction([
      prisma.photo.updateMany({
        where: { category: cat.slug },
        data: { category: opts.reassignTo },
      }),
      prisma.photoCategory.delete({ where: { id: cat.id } }),
    ]);
    return;
  }

  const photoCount = await prisma.photo.count({ where: { category: cat.slug } });
  if (photoCount > 0) throw new PhotoCategoryDeleteBlockedError(photoCount);
  await prisma.photoCategory.delete({ where: { id: cat.id } });
}

/**
 * Merge `fromSlug` into `intoSlug`: bulk-update photos, then delete
 * the source category. Built-in source categories cannot be merged
 * away (would orphan code that references them).
 */
export async function mergePhotoCategories(opts: {
  fromSlug: string;
  intoSlug: string;
}) {
  if (opts.fromSlug === opts.intoSlug) {
    throw new Error("Cannot merge a category into itself");
  }
  const [from, into] = await Promise.all([
    prisma.photoCategory.findUnique({ where: { slug: opts.fromSlug } }),
    prisma.photoCategory.findUnique({ where: { slug: opts.intoSlug } }),
  ]);
  if (!from) throw new Error(`Source category "${opts.fromSlug}" not found`);
  if (!into) throw new Error(`Target category "${opts.intoSlug}" not found`);
  if (from.isBuiltIn) throw new PhotoCategoryBuiltInError();

  return prisma.$transaction([
    prisma.photo.updateMany({
      where: { category: from.slug },
      data: { category: into.slug },
    }),
    prisma.photoCategory.delete({ where: { id: from.id } }),
  ]);
}
