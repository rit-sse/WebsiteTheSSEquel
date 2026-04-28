"use client";

import Image from "next/image";
import type { PhotoDto } from "./PhotosClient";

export function PhotoGrid({
  photos,
  onPhotoClick,
}: {
  photos: PhotoDto[];
  onPhotoClick: (photo: PhotoDto) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onPhotoClick(photo)}
          className="group relative aspect-square overflow-hidden rounded-md border border-border bg-secondary-background text-left"
        >
          <Image
            src={photo.imageUrl}
            alt={photo.altText || photo.caption || photo.originalFilename}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="truncate text-sm font-medium text-white">
              {photo.caption || photo.event?.title || "SSE photo"}
            </p>
            <p className="text-xs text-white/75">
              {formatPhotoDate(photo.sortDate)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function formatPhotoDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
