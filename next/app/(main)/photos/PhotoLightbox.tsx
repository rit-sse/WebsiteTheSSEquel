"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PhotoDto } from "./PhotosClient";

export function PhotoLightbox({
  photos,
  selectedIndex,
  onSelect,
  onClose,
  onRequestMore,
  paginating,
}: {
  photos: PhotoDto[];
  selectedIndex: number;
  onSelect: (index: number | null) => void;
  onClose: () => void;
  onRequestMore?: () => Promise<void> | void;
  paginating?: boolean;
}) {
  const photo = photos[selectedIndex];
  const requestedRef = useRef<number | null>(null);

  // Prefetch the next page when the user is two photos away from the end —
  // keeps lightbox navigation continuous on huge libraries without a stutter.
  useEffect(() => {
    if (!onRequestMore) return;
    if (selectedIndex < photos.length - 3) return;
    if (requestedRef.current === photos.length) return;
    requestedRef.current = photos.length;
    void onRequestMore();
  }, [onRequestMore, photos.length, selectedIndex]);

  // Arrow-key + Escape navigation. Lightbox is keyboard-first.
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && selectedIndex > 0) {
        event.preventDefault();
        onSelect(selectedIndex - 1);
      } else if (
        event.key === "ArrowRight" &&
        selectedIndex < photos.length - 1
      ) {
        event.preventDefault();
        onSelect(selectedIndex + 1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onSelect, photos.length, selectedIndex]);

  if (!photo) return null;

  const canGoPrevious = selectedIndex > 0;
  const canGoNext = selectedIndex < photos.length - 1;
  const altText = photo.altText || photo.caption || photo.originalFilename;
  const headerTitle =
    photo.caption || photo.event?.title || humanizeCategory(photo.category);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-[1100px] w-full p-0 overflow-hidden bg-surface-1">
        <DialogTitle className="sr-only">{headerTitle}</DialogTitle>
        <DialogDescription className="sr-only">
          {altText}
        </DialogDescription>

        {/* Image stage. Black backdrop so wide-aspect photos breathe. */}
        <div className="relative h-[60vh] md:h-[70vh] bg-black">
          <Image
            key={photo.id}
            src={photo.imageUrl}
            alt={altText}
            fill
            sizes="(max-width: 1024px) 100vw, 1100px"
            className="object-contain"
            priority
          />

          <Button
            type="button"
            size="icon"
            variant="neutral"
            className="absolute right-3 top-3 h-9 w-9"
            onClick={onClose}
            aria-label="Close lightbox"
          >
            <X className="size-4" />
          </Button>

          {canGoPrevious && (
            <Button
              type="button"
              size="icon"
              variant="neutral"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10"
              onClick={() => onSelect(selectedIndex - 1)}
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-5" />
            </Button>
          )}
          {canGoNext && (
            <Button
              type="button"
              size="icon"
              variant="neutral"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10"
              onClick={() => onSelect(selectedIndex + 1)}
              aria-label="Next photo"
            >
              <ChevronRight className="size-5" />
            </Button>
          )}

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white/95">
            {selectedIndex + 1} / {photos.length}
            {paginating && (
              <Loader2 className="ml-2 inline-block size-3 animate-spin" />
            )}
          </div>
        </div>

        {/* Metadata footer. Reads cleanly against the surface so the photo
            stays the focus, but everything useful is one glance away. */}
        <div className="space-y-3 p-5 md:p-6 border-t border-border/40">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg md:text-xl font-bold leading-tight truncate">
                {headerTitle}
              </h2>
              {photo.caption && photo.event?.title && (
                <p className="text-sm text-muted-foreground truncate">
                  from {photo.event.title}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Badge variant="outline" className="capitalize">
                <Tag className="mr-1 h-3 w-3" />
                {humanizeCategory(photo.category)}
              </Badge>
              <Badge variant="secondary">
                <Calendar className="mr-1 h-3 w-3" />
                {formatPhotoDate(photo.sortDate)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span className="truncate">{photo.originalFilename}</span>
            <span className="shrink-0">
              {photo.photoDate
                ? "Date from EXIF or officer"
                : "Sorted by upload date"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatPhotoDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function humanizeCategory(category: string) {
  if (!category) return "SSE photo";
  return category.charAt(0).toUpperCase() + category.slice(1);
}
