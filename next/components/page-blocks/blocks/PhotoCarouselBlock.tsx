/**
 * PhotoCarouselBlock — the headline feature.
 *
 * Server component that fetches a pool of photos for the assigned
 * category, then hands them to a client crossfade component. The
 * client picks a random window after hydration so different visitors
 * see different photos without breaking SSR caching.
 *
 * The pool fetch is cached for 60s by `getPhotoPool` so popular pages
 * don't hammer the DB.
 */
import Link from "next/link";
import { getPhotoPool } from "@/lib/pageBuilder/photoPool";
import { PhotoCarouselClient } from "./PhotoCarouselClient";
import type { BlockRenderProps } from "../types";
import { ImageOff } from "lucide-react";

const ASPECT_TO_PADDING: Record<string, string> = {
  "16:9": "56.25%",
  "4:3": "75%",
  "3:2": "66.66%",
  "1:1": "100%",
  "4:5": "125%",
  "21:9": "42.857%",
};

export async function PhotoCarouselBlock({
  props,
  preview,
}: BlockRenderProps<"photoCarousel">) {
  const pool = await getPhotoPool({
    categorySlug: props.categorySlug,
    count: props.count,
    order: props.order,
  });

  const padding = ASPECT_TO_PADDING[props.aspectRatio] ?? ASPECT_TO_PADDING["16:9"]!;

  if (pool.length === 0) {
    return <EmptyCarouselPlaceholder padding={padding} preview={preview} categorySlug={props.categorySlug} />;
  }

  return (
    <div className="my-8">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-surface-2 neo:border-2 neo:border-border clean:border clean:border-border/30 neo:shadow-neo"
        style={{ paddingBottom: padding }}
      >
        <PhotoCarouselClient
          pool={pool}
          count={Math.min(props.count, pool.length)}
          intervalMs={props.intervalMs}
          showCaptions={props.showCaptions}
          order={props.order}
        />
      </div>
    </div>
  );
}

function EmptyCarouselPlaceholder({
  padding,
  preview,
  categorySlug,
}: {
  padding: string;
  preview?: boolean;
  categorySlug: string;
}) {
  return (
    <div className="my-8">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-surface-2 border-2 border-dashed border-border/40"
        style={{ paddingBottom: padding }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <ImageOff className="h-8 w-8 opacity-60" />
          <p className="text-sm font-medium">
            No photos in “{categorySlug}” yet
          </p>
          {preview && (
            <Link
              href="/dashboard/photos"
              className="text-xs underline hover:text-foreground"
            >
              Upload some →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
