/**
 * Photo pool fetcher for carousel/grid blocks.
 *
 * Wrapped in `unstable_cache` keyed by category slug + order, with a
 * 60-second revalidate. The randomness needed for the cascade effect
 * happens client-side — the server response is fully cacheable so a
 * popular page doesn't slam the database with random picks.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { getPhotoImageUrl } from "@/lib/photos";

export interface PhotoPoolItem {
  id: number;
  imageUrl: string;
  alt: string;
  caption: string | null;
  sortDate: string;
}

/** Pool size for carousel: ~5x the displayed count, capped at 50. */
function poolSize(count: number): number {
  return Math.min(Math.max(count * 5, 20), 50);
}

async function fetchPool(opts: {
  categorySlug: string;
  count: number;
  order: "newest" | "random";
}): Promise<PhotoPoolItem[]> {
  const photos = await prisma.photo.findMany({
    where: {
      category: opts.categorySlug,
      status: "published",
    },
    take: opts.order === "newest" ? opts.count : poolSize(opts.count),
    orderBy: [{ sortDate: "desc" }, { id: "desc" }],
    select: {
      id: true,
      galleryKey: true,
      altText: true,
      caption: true,
      originalFilename: true,
      sortDate: true,
    },
  });
  return photos.map((p) => ({
    id: p.id,
    imageUrl: getPhotoImageUrl(p.galleryKey),
    alt: p.altText || p.caption || p.originalFilename,
    caption: p.caption,
    sortDate: p.sortDate.toISOString(),
  }));
}

/**
 * Cached pool fetch — same args produce same result for up to 60s.
 * The `revalidatePath`/`revalidateTag` from page mutations doesn't
 * invalidate this directly, so a freshly uploaded photo can take up
 * to a minute to appear in carousels. Acceptable for a CMS.
 */
export const getPhotoPool = unstable_cache(
  fetchPool,
  ["photoCarouselPool"],
  { revalidate: 60, tags: ["photoCarouselPool"] }
);
