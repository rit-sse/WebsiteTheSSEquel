/**
 * Server-side helpers for the page builder.
 *
 * Public callers (catch-all route, RSC) use `getPagePublic` to fetch a
 * published page by slug. Officer callers use `getPageById` /
 * `getPageDraftBySlug` for the editor + preview flows.
 *
 * Mutation helpers (create/update/publish/archive/restore/rollback) are
 * here too so the API route handlers stay thin.
 */
import "server-only";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  EMPTY_PAGE_CONTENT,
  PageContent,
  PageContentSchema,
  autoDescribe,
} from "@/lib/pageBuilder/blocks";
import { contentHash } from "@/lib/pageBuilder/hash";

export type PageRecord = Prisma.PageGetPayload<Record<string, never>>;

const PUBLIC_PAGE_FIELDS = {
  id: true,
  slug: true,
  title: true,
  status: true,
  systemLocked: true,
  publishedContent: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  navSection: true,
  showInNav: true,
} as const;

const FULL_PAGE_FIELDS = undefined; // returns all columns

/**
 * Fetch a published page for public rendering. Returns null if the page
 * doesn't exist OR exists but is DRAFT (caller should 404). Returns the
 * record with status=ARCHIVED so the caller can return a 410.
 */
export async function getPagePublic(slug: string) {
  return prisma.page.findUnique({
    where: { slug },
    select: PUBLIC_PAGE_FIELDS,
  });
}

/**
 * Fetch the full page (including draft) for officer editor / preview.
 * Returns null if the page doesn't exist.
 */
export async function getPageDraftBySlug(slug: string) {
  return prisma.page.findUnique({
    where: { slug },
    select: FULL_PAGE_FIELDS,
  });
}

export async function getPageById(id: number) {
  return prisma.page.findUnique({
    where: { id },
    select: FULL_PAGE_FIELDS,
  });
}

/** List all pages for the dashboard (officer-only callers). */
export async function listPagesForDashboard(opts: { includeArchived?: boolean } = {}) {
  return prisma.page.findMany({
    where: opts.includeArchived ? {} : { status: { not: "ARCHIVED" } },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      systemLocked: true,
      navSection: true,
      showInNav: true,
      publishedAt: true,
      updatedAt: true,
      archivedAt: true,
    },
    orderBy: [{ status: "asc" }, { slug: "asc" }],
  });
}

/** List trashed (archived) pages. */
export async function listArchivedPages() {
  return prisma.page.findMany({
    where: { status: "ARCHIVED" },
    select: {
      id: true,
      slug: true,
      title: true,
      archivedAt: true,
      updatedAt: true,
    },
    orderBy: { archivedAt: "desc" },
  });
}

interface CreatePageOpts {
  slug: string;
  title: string;
  createdById: number;
  navSection?: Prisma.PageCreateInput["navSection"];
  showInNav?: boolean;
  navLabel?: string;
  navOrder?: number;
}

export async function createPage(opts: CreatePageOpts) {
  return prisma.page.create({
    data: {
      slug: opts.slug,
      title: opts.title,
      status: "DRAFT",
      draftContent: EMPTY_PAGE_CONTENT as unknown as Prisma.InputJsonValue,
      createdById: opts.createdById,
      navSection: opts.navSection ?? "HIDDEN",
      showInNav: opts.showInNav ?? false,
      navLabel: opts.navLabel ?? null,
      navOrder: opts.navOrder ?? 0,
    },
  });
}

export interface UpdatePageOpts {
  id: number;
  title?: string;
  slug?: string;
  systemLocked?: boolean;
  draftContent?: PageContent;
  seoTitle?: string | null;
  seoDescription?: string | null;
  showInNav?: boolean;
  navSection?: Prisma.PageUpdateInput["navSection"];
  navLabel?: string | null;
  navOrder?: number;
  expectedUpdatedAt?: Date;
}

export class ConcurrentEditError extends Error {
  constructor() {
    super("This page was modified since you opened it.");
    this.name = "ConcurrentEditError";
  }
}

export async function updatePage(opts: UpdatePageOpts) {
  // Optimistic concurrency: if expectedUpdatedAt is supplied, only
  // update when it still matches. Surfaces in the editor as a
  // "page changed since you opened it" prompt.
  const where: Prisma.PageWhereUniqueInput = opts.expectedUpdatedAt
    ? { id: opts.id, updatedAt: opts.expectedUpdatedAt }
    : { id: opts.id };

  const data: Prisma.PageUpdateInput = {};
  if (opts.title !== undefined) data.title = opts.title;
  if (opts.slug !== undefined) data.slug = opts.slug;
  if (opts.systemLocked !== undefined) data.systemLocked = opts.systemLocked;
  if (opts.draftContent !== undefined) {
    data.draftContent = opts.draftContent as unknown as Prisma.InputJsonValue;
  }
  if (opts.seoTitle !== undefined) data.seoTitle = opts.seoTitle;
  if (opts.seoDescription !== undefined) data.seoDescription = opts.seoDescription;
  if (opts.showInNav !== undefined) data.showInNav = opts.showInNav;
  if (opts.navSection !== undefined) data.navSection = opts.navSection;
  if (opts.navLabel !== undefined) data.navLabel = opts.navLabel;
  if (opts.navOrder !== undefined) data.navOrder = opts.navOrder;

  try {
    return await prisma.page.update({ where, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      // P2025 = "Record to update not found" — either the row vanished
      // OR the updatedAt mismatch tripped the unique-where guard.
      throw new ConcurrentEditError();
    }
    throw err;
  }
}

/**
 * Publish: validate draft content, hash it, and only insert a new
 * PageVersion row if the hash differs from the latest published one.
 * Returns `{ noop: true }` if the publish was a no-op.
 */
export async function publishPage(opts: {
  id: number;
  publishedById: number;
}): Promise<{ noop: boolean; page: PageRecord; version?: { id: number; version: number } }> {
  const page = await prisma.page.findUnique({ where: { id: opts.id } });
  if (!page) throw new Error("Page not found");

  // Re-validate the draft against the current schema before publishing.
  const parsed = PageContentSchema.safeParse(page.draftContent);
  if (!parsed.success) {
    throw new Error(
      `Draft content is invalid: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
  }
  const draft = parsed.data;
  const hash = contentHash(draft);

  // Find the latest version for this page; short-circuit if hash matches
  // and the page is already PUBLISHED with this content.
  const latestVersion = await prisma.pageVersion.findFirst({
    where: { pageId: page.id },
    orderBy: { version: "desc" },
    select: { id: true, version: true, contentHash: true },
  });

  if (
    page.status === "PUBLISHED" &&
    latestVersion &&
    latestVersion.contentHash === hash
  ) {
    return { noop: true, page };
  }

  const nextVersion = (latestVersion?.version ?? 0) + 1;

  // Auto-fill SEO description if officer didn't set one explicitly.
  const seoDescription =
    page.seoDescription ?? autoDescribe(draft, page.title).slice(0, 500);

  const [updatedPage, newVersion] = await prisma.$transaction([
    prisma.page.update({
      where: { id: page.id },
      data: {
        status: "PUBLISHED",
        publishedContent: draft as unknown as Prisma.InputJsonValue,
        publishedAt: new Date(),
        publishedById: opts.publishedById,
        seoDescription,
      },
    }),
    prisma.pageVersion.create({
      data: {
        pageId: page.id,
        version: nextVersion,
        content: draft as unknown as Prisma.InputJsonValue,
        contentHash: hash,
        publishedById: opts.publishedById,
      },
    }),
  ]);

  return {
    noop: false,
    page: updatedPage,
    version: { id: newVersion.id, version: newVersion.version },
  };
}

/** Flip a published page back to DRAFT. publishedContent is preserved
 *  for restoration but the public catch-all stops serving it. */
export async function unpublishPage(id: number) {
  return prisma.page.update({
    where: { id },
    data: { status: "DRAFT" },
  });
}

/** Soft-delete: status=ARCHIVED + archive metadata. */
export async function archivePage(opts: { id: number; archivedById: number }) {
  return prisma.page.update({
    where: { id: opts.id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
      archivedById: opts.archivedById,
    },
  });
}

/** Restore an archived page back to DRAFT. */
export async function restorePage(id: number) {
  return prisma.page.update({
    where: { id },
    data: {
      status: "DRAFT",
      archivedAt: null,
      archivedById: null,
    },
  });
}

/** List version history for a page (officer-only). */
export async function listVersions(pageId: number) {
  return prisma.pageVersion.findMany({
    where: { pageId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      contentHash: true,
      publishedAt: true,
      publishedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Copy a version's content into the page's draft (does NOT publish). */
export async function rollbackToVersion(opts: { pageId: number; versionId: number }) {
  const version = await prisma.pageVersion.findUnique({
    where: { id: opts.versionId },
    select: { id: true, pageId: true, content: true },
  });
  if (!version || version.pageId !== opts.pageId) {
    throw new Error("Version not found for this page");
  }
  return prisma.page.update({
    where: { id: opts.pageId },
    data: { draftContent: version.content as Prisma.InputJsonValue },
  });
}
