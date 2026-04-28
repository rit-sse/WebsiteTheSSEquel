"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PhotoDto } from "./PhotosClient";

export function PhotoLightbox({
  photos,
  selectedIndex,
  onSelect,
  onClose,
}: {
  photos: PhotoDto[];
  selectedIndex: number;
  onSelect: (index: number | null) => void;
  onClose: () => void;
}) {
  const photo = photos[selectedIndex];
  if (!photo) return null;

  const canGoPrevious = selectedIndex > 0;
  const canGoNext = selectedIndex < photos.length - 1;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{photo.caption || photo.event?.title || "Photo"}</DialogTitle>
        </DialogHeader>
        <div className="relative min-h-[60vh] overflow-hidden rounded-md bg-black">
          <Image
            src={photo.imageUrl}
            alt={photo.altText || photo.caption || photo.originalFilename}
            fill
            sizes="100vw"
            className="object-contain"
          />
          <Button
            type="button"
            size="icon"
            variant="neutral"
            className="absolute right-3 top-3"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
          {canGoPrevious && (
            <Button
              type="button"
              size="icon"
              variant="neutral"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              onClick={() => onSelect(selectedIndex - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          {canGoNext && (
            <Button
              type="button"
              size="icon"
              variant="neutral"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => onSelect(selectedIndex + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
        <div className="grid gap-1 text-sm text-muted-foreground">
          {photo.event && <p>{photo.event.title}</p>}
          <p>{formatPhotoDate(photo.sortDate)}</p>
          {photo.photoDate ? (
            <p>Photo date from metadata or officer entry</p>
          ) : (
            <p>Sorted by upload date</p>
          )}
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
  }).format(new Date(value));
}
