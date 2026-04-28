"use client";

import Image from "next/image";
import type { PhotoDto } from "./PhotosClient";
import type { PhotoMonthGroup } from "./PhotosClient";

export function PhotoGrid({
  groups,
  onPhotoClick,
}: {
  groups: PhotoMonthGroup[];
  onPhotoClick: (photo: PhotoDto) => void;
}) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <SectionHeader group={group} />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {group.photos.map((photo) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                onClick={() => onPhotoClick(photo)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SectionHeader({ group }: { group: PhotoMonthGroup }) {
  // Sticky inside the page so the user always knows where they are while
  // scrolling. We pin to the top of the viewport with a soft glass layer
  // so it reads against any photo behind it.
  return (
    <div className="sticky top-0 z-10 -mx-1 flex items-baseline justify-between gap-3 px-1 py-2 backdrop-blur-md bg-surface-1/85 supports-[backdrop-filter]:bg-surface-1/70 rounded-md">
      <div className="flex items-baseline gap-3 min-w-0">
        <h2 className="font-display text-lg md:text-xl font-bold leading-none truncate">
          {group.label}
        </h2>
        <span className="text-xs text-muted-foreground shrink-0">
          {group.photos.length}{" "}
          {group.photos.length === 1 ? "photo" : "photos"}
        </span>
      </div>
    </div>
  );
}

function PhotoTile({
  photo,
  onClick,
}: {
  photo: PhotoDto;
  onClick: () => void;
}) {
  const dayLabel = formatDay(photo.sortDate);
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        // `block w-full` is load-bearing: <button> defaults to display:
        // inline-block, and inline-block items in a CSS grid track don't
        // anchor their width to the column track — so `aspect-square`
        // collapses to ~0px and the photo renders as a thin strip.
        "group relative block w-full aspect-square overflow-hidden rounded-md text-left",
        "bg-surface-2",
        "neo:border-2 neo:border-border/40 neo:hover:border-border",
        "clean:border clean:border-border/20 clean:hover:border-border/50",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <Image
        src={photo.imageUrl}
        alt={photo.altText || photo.caption || photo.originalFilename}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 14vw"
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        loading="lazy"
      />

      {/* Subtle gradient bottom overlay shows on hover and surfaces useful
          context: caption (or event/category fallback) + the day-of-month so
          users can pinpoint a photo within a month section at a glance. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <p className="truncate text-xs font-semibold text-white">
          {photo.caption ||
            photo.event?.title ||
            humanizeCategory(photo.category)}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-white/75">
          {dayLabel}
        </p>
      </div>

      {/* Tiny day chip in the corner so users can scan dates without
          hovering — keeps the gallery legible when scrubbing. */}
      <div className="absolute left-1.5 top-1.5 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white/95 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {dayLabel}
      </div>
    </button>
  );
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function humanizeCategory(category: string) {
  if (!category) return "SSE photo";
  return category.charAt(0).toUpperCase() + category.slice(1);
}
