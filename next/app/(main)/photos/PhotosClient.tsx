"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhotoFilters } from "./PhotoFilters";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoLightbox } from "./PhotoLightbox";

export type PhotoEventOption = {
  id: string;
  title: string;
  date: string;
};

export type PhotoDto = {
  id: number;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  category: string;
  event: PhotoEventOption | null;
  photoDate: string | null;
  uploadedAt: string;
  sortDate: string;
  originalFilename: string;
  status?: string;
};

type Filters = {
  year: string;
  eventId: string;
  category: string;
  q: string;
};

export function PhotosClient({
  initialPhotos,
  initialNextCursor,
  events,
  years,
  categories,
}: {
  initialPhotos: PhotoDto[];
  initialNextCursor: string | null;
  events: PhotoEventOption[];
  years: number[];
  categories: string[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [filters, setFilters] = useState<Filters>({
    year: "",
    eventId: "",
    category: "",
    q: "",
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.year) params.set("year", filters.year);
    if (filters.eventId) params.set("eventId", filters.eventId);
    if (filters.category) params.set("category", filters.category);
    if (filters.q.trim()) params.set("q", filters.q.trim());
    return params.toString();
  }, [filters]);

  async function loadPhotos(cursor?: string | null, append = false) {
    setLoading(true);
    try {
      const params = new URLSearchParams(queryString);
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`/api/photos?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load photos");
      const data = await response.json();
      setPhotos((prev) => (append ? [...prev, ...data.photos] : data.photos));
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PhotoFilters
        filters={filters}
        onChange={(next) => setFilters(next)}
        onApply={() => loadPhotos(null, false)}
        events={events}
        years={years}
        categories={categories}
        disabled={loading}
      />
      <PhotoGrid
        photos={photos}
        onPhotoClick={(photo) => {
          const index = photos.findIndex((item) => item.id === photo.id);
          setSelectedIndex(index >= 0 ? index : null);
        }}
      />
      {photos.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          No photos match these filters.
        </div>
      )}
      {nextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => loadPhotos(nextCursor, true)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
      {selectedIndex !== null && (
        <PhotoLightbox
          photos={photos}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
