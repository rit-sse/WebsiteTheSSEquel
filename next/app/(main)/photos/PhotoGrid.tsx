"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import type { PhotoDto } from "./PhotosClient";
import type { PhotoMonthGroup } from "./PhotosClient";

export const PHOTO_GRID_CLASSES =
  "grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 min-[1800px]:grid-cols-9";

const HEADER_HEIGHT = 48;
const OVERSCAN_ROWS = 12;

type VirtualPhotoItem =
  | {
      type: "header";
      key: string;
      group: PhotoMonthGroup;
    }
  | {
      type: "row";
      key: string;
      groupKey: string;
      photos: PhotoDto[];
      rowIndex: number;
    };

export function PhotoGrid({
  groups,
  onPhotoClick,
}: {
  groups: PhotoMonthGroup[];
  onPhotoClick: (photo: PhotoDto) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const measuredNode = node;

    function updateMeasurements() {
      setContainerWidth(measuredNode.getBoundingClientRect().width);
    }

    updateMeasurements();
    const observer = new ResizeObserver(updateMeasurements);
    observer.observe(measuredNode);
    window.addEventListener("resize", updateMeasurements);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMeasurements);
    };
  }, []);

  const columns = useMemo(
    () => getColumnCount(containerWidth),
    [containerWidth]
  );
  const rowHeight = useMemo(
    () => getEstimatedRowHeight(containerWidth, columns),
    [columns, containerWidth]
  );
  const items = useMemo(
    () => buildVirtualItems(groups, columns),
    [columns, groups]
  );

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (index) =>
      items[index]?.type === "header" ? HEADER_HEIGHT : rowHeight,
    overscan: OVERSCAN_ROWS,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          return (
            <div
              key={item.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {item.type === "header" ? (
                <SectionHeader
                  group={item.group}
                  reducedMotion={Boolean(reducedMotion)}
                />
              ) : (
                <div className={PHOTO_GRID_CLASSES}>
                  {item.photos.map((photo, index) => (
                    <PhotoTile
                      key={photo.id}
                      photo={photo}
                      index={index}
                      reducedMotion={Boolean(reducedMotion)}
                      onClick={() => onPhotoClick(photo)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({
  group,
  reducedMotion,
}: {
  group: PhotoMonthGroup;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "120px" }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mb-3 flex h-9 items-baseline justify-between gap-3 rounded-md bg-surface-1/85 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-surface-1/70"
    >
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="truncate font-display text-lg font-bold leading-none md:text-xl">
          {group.label}
        </h2>
        <span className="shrink-0 text-xs text-muted-foreground">
          {group.photos.length}{" "}
          {group.photos.length === 1 ? "photo" : "photos"}
        </span>
      </div>
    </motion.div>
  );
}

export function PhotoTile({
  photo,
  index,
  reducedMotion,
  onClick,
}: {
  photo: PhotoDto;
  index: number;
  reducedMotion: boolean;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const dayLabel = formatDay(photo.sortDate);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 10 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
      whileHover={reducedMotion ? undefined : { y: -2 }}
      viewport={{ once: true, margin: "160px" }}
      transition={{
        duration: 0.24,
        delay: Math.min(index, 8) * 0.018,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div
        className={[
          "relative w-full overflow-hidden rounded-md bg-surface-2",
          "neo:border-2 neo:border-border/40 group-hover:neo:border-border",
          "clean:border clean:border-border/20 group-hover:clean:border-border/50",
          "transition-[border-color,box-shadow] duration-150",
          "group-hover:shadow-md",
        ].join(" ")}
        style={{ paddingBottom: "100%" }}
      >
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        <Image
          src={photo.imageUrl}
          alt={photo.altText || photo.caption || photo.originalFilename}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 14vw, 12vw"
          className={[
            "object-cover transition-[opacity,transform] duration-300 ease-out group-hover:scale-[1.04]",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />

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

        <div className="absolute left-1.5 top-1.5 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white/95 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {dayLabel}
        </div>
      </div>
    </motion.button>
  );
}

function buildVirtualItems(
  groups: PhotoMonthGroup[],
  columns: number
): VirtualPhotoItem[] {
  const items: VirtualPhotoItem[] = [];
  for (const group of groups) {
    items.push({
      type: "header",
      key: `${group.key}-header`,
      group,
    });

    for (let index = 0; index < group.photos.length; index += columns) {
      items.push({
        type: "row",
        key: `${group.key}-row-${index / columns}`,
        groupKey: group.key,
        photos: group.photos.slice(index, index + columns),
        rowIndex: index / columns,
      });
    }
  }
  return items;
}

function getColumnCount(width: number) {
  if (width >= 1800) return 9;
  if (width >= 1536) return 8;
  if (width >= 1280) return 7;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

function getEstimatedRowHeight(width: number, columns: number) {
  if (!width) return 180;
  const gap = width >= 640 ? 8 : 6;
  const tileWidth = (width - gap * (columns - 1)) / columns;
  return tileWidth + gap;
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
