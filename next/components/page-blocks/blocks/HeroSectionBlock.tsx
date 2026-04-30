import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DancingLetters from "@/components/dancing-letters";
import { getPhotoPool } from "@/lib/pageBuilder/photoPool";
import { PhotoCarouselClient } from "./PhotoCarouselClient";
import type { BlockRenderProps } from "../types";

const VARIANT_CLASS: Record<string, string> = {
  orange: "bg-categorical-orange text-foreground",
  blue: "bg-categorical-blue text-foreground",
  pink: "bg-categorical-pink text-foreground",
  green: "bg-categorical-green text-foreground",
  neutral: "bg-card text-foreground",
};

/**
 * HeroSectionBlock — page-top hero with title, optional dancing word,
 * description, callouts, CTAs, and an optional category-driven photo
 * carousel on the right side.
 *
 * Replicates the homepage hero (`HeroCTA.tsx` + `HeroImage.tsx`)
 * shape so the homepage can migrate to a single block + dynamic photo
 * carousel pulling from the `general` (or any) category.
 */
export async function HeroSectionBlock({
  props,
  preview,
}: BlockRenderProps<"heroSection">) {
  const hasPhotos = !!props.photoCategorySlug?.trim();
  const pool = hasPhotos
    ? await getPhotoPool({
        categorySlug: props.photoCategorySlug!,
        count: 8,
        order: "random",
      })
    : [];

  return (
    <section className="my-6 flex flex-col items-stretch gap-8 lg:flex-row lg:gap-12">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          {props.title}
        </h1>
        {props.dancingWord && (
          <div className="mt-2 self-start">
            <DancingLetters
              text={props.dancingWord}
              className="!text-4xl md:!text-5xl lg:!text-6xl !font-display"
              letterClassName="!text-categorical-orange"
            />
          </div>
        )}
        {props.description && (
          <p className="mt-5 max-w-prose text-base md:text-lg text-foreground/85">
            {props.description}
          </p>
        )}

        {(props.calloutLeft || props.calloutRight) && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {props.calloutLeft && <Callout text={props.calloutLeft} accent="bg-categorical-blue" />}
            {props.calloutRight && <Callout text={props.calloutRight} accent="bg-categorical-pink" />}
          </div>
        )}

        {props.ctas.length > 0 && (
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {props.ctas.map((cta, i) => (
              <Link
                key={i}
                href={cta.href}
                className={[
                  "inline-flex items-center gap-2 rounded-lg border-2 border-border px-5 py-2.5 font-display font-semibold text-sm",
                  "transition-all neo:shadow-neo neo:hover:translate-x-[2px] neo:hover:translate-y-[2px] neo:hover:shadow-none",
                  VARIANT_CLASS[cta.variant] ?? VARIANT_CLASS.neutral,
                ].join(" ")}
              >
                {cta.text}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {hasPhotos && pool.length > 0 && (
        <div className="flex-1 self-stretch lg:max-w-[55%]">
          <div
            className="relative w-full overflow-hidden rounded-lg bg-surface-2 border-2 border-border neo:shadow-neo"
            style={{ paddingBottom: "62.5%" }}
          >
            <PhotoCarouselClient
              pool={pool}
              count={Math.min(pool.length, 8)}
              intervalMs={6000}
              showCaptions={false}
              order="random"
            />
          </div>
        </div>
      )}
      {hasPhotos && pool.length === 0 && preview && (
        <div className="flex-1 self-stretch lg:max-w-[55%]">
          <div className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-border/40 bg-surface-2 p-8 text-center text-sm text-muted-foreground">
            No photos in &ldquo;{props.photoCategorySlug}&rdquo; yet —{" "}
            <Link className="underline" href="/dashboard/photos">
              upload some
            </Link>
            .
          </div>
        </div>
      )}
    </section>
  );
}

function Callout({ text, accent }: { text: string; accent: string }) {
  return (
    <div className="relative flex items-center gap-3 rounded-lg border-2 border-border bg-card p-3 neo:shadow-neo">
      <span className={["h-8 w-1 rounded", accent].join(" ")} aria-hidden />
      <span className="text-sm font-medium text-foreground/90">{text}</span>
    </div>
  );
}
