import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlockRenderProps } from "../types";

/**
 * ZCardRowBlock — alternating left/right image+text rows. Replicates
 * the AboutUsSlot / Committee / Involvement layout used across the
 * site, but as a single composable block.
 */
export function ZCardRowBlock({ props }: BlockRenderProps<"zCardRow">) {
  return (
    <div className="my-8 flex flex-col gap-10">
      {props.items.map((item, i) => {
        const imageRight = i % 2 === 1;
        return (
          <article
            key={i}
            className={[
              "grid items-center gap-6 md:gap-12 rounded-2xl border-2 border-border bg-card p-6 md:p-8 neo:shadow-neo",
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
        );
      })}
    </div>
  );
}

function ImageSide({ item }: { item: BlockRenderProps<"zCardRow">["props"]["items"][number] }) {
  if (!item.imageSrc) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-lg bg-surface-2"
        style={{ paddingBottom: "75%" }}
      />
    );
  }
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-surface-2"
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

function TextSide({ item }: { item: BlockRenderProps<"zCardRow">["props"]["items"][number] }) {
  return (
    <div>
      <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{item.title}</h3>
      <p className="mt-3 text-sm md:text-base text-foreground/85 whitespace-pre-line">{item.body}</p>
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
