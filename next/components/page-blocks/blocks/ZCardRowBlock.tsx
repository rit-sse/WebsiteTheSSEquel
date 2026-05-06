import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RevealOnScroll from "@/components/common/RevealOnScroll";
import { Card } from "@/components/ui/card";
import { getPhotoPool } from "@/lib/pageBuilder/photoPool";
import { PhotoCarouselClient } from "./PhotoCarouselClient";
import type { BlockRenderProps } from "../types";

/**
 * ZCardRowBlock — alternating left/right image+text rows. Replicates
 * the AboutUsSlot / Committee / Involvement layout used across the
 * site, but as a single composable block.
 */
export function ZCardRowBlock({ props }: BlockRenderProps<"zCardRow">) {
  return (
    <div className="pt-4">
      {props.items.map((item, i) => {
        const imageRight = i % 2 === 1;
        const card = (
          <Card key={i} depth={2} className="mb-8 px-6 py-4 md:px-8 md:py-5">
            <article
              className={[
                "grid items-center gap-6 md:gap-10",
                imageRight
                  ? "md:grid-cols-[2fr_1fr]"
                  : "md:grid-cols-[1fr_2fr]",
              ].join(" ")}
            >
              {imageRight ? (
                <>
                  <TextSide item={item} />
                  <ImageSide item={item} />
                </>
              ) : (
                <>
                  <ImageSide item={item} />
                  <TextSide item={item} />
                </>
              )}
            </article>
          </Card>
        );

        return (props.revealOnScroll ?? false) ? (
          <RevealOnScroll key={i}>{card}</RevealOnScroll>
        ) : (
          card
        );
      })}
    </div>
  );
}

async function ImageSide({
  item,
}: {
  item: BlockRenderProps<"zCardRow">["props"]["items"][number];
}) {
  if (item.photoCategorySlug) {
    const pool = await getPhotoPool({
      categorySlug: item.photoCategorySlug,
      count: item.photoCount,
      order: "random",
    });
    if (pool.length > 0) {
      return (
        <div
          className="relative w-full overflow-hidden rounded-md bg-surface-2"
          style={{ paddingBottom: "75%" }}
        >
          <PhotoCarouselClient
            pool={pool}
            count={Math.min(item.photoCount, pool.length)}
            intervalMs={item.photoIntervalMs}
            showCaptions={false}
            order="random"
          />
        </div>
      );
    }
  }

  if (!item.imageSrc) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-md bg-surface-2"
        style={{ paddingBottom: "75%" }}
      />
    );
  }
  return (
    <div
      className="relative w-full overflow-hidden rounded-md bg-surface-2"
      style={{ paddingBottom: "75%" }}
    >
      <Image
        src={item.imageSrc}
        alt={item.imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
      />
    </div>
  );
}

function TextSide({
  item,
}: {
  item: BlockRenderProps<"zCardRow">["props"]["items"][number];
}) {
  return (
    <div>
      <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
        {item.title}
      </h3>
      <p className="mt-3 text-sm md:text-base text-foreground/85 whitespace-pre-line">
        {item.body}
      </p>
      {item.ctaText && item.ctaHref && (
        <Link
          href={item.ctaHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:underline"
        >
          {item.ctaText}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
