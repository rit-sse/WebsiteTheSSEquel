"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImageOff, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

export type Filters = {
  year: string;
  eventId: string;
  category: string;
  q: string;
};

const EMPTY_FILTERS: Filters = {
  year: "",
  eventId: "",
  category: "",
  q: "",
};

export function PhotosClient({
  initialPhotos,
  initialNextCursor,
  events,
  years,
  categories,
  totalPhotoCount,
}: {
  initialPhotos: PhotoDto[];
  initialNextCursor: string | null;
  events: PhotoEventOption[];
  years: number[];
  categories: string[];
  totalPhotoCount: number;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [paginating, setPaginating] = useState(false);

  const isFiltered = useMemo(
    () =>
      Boolean(
        appliedFilters.year ||
          appliedFilters.eventId ||
          appliedFilters.category ||
          appliedFilters.q.trim()
      ),
    [appliedFilters]
  );

  const buildQuery = useCallback(
    (source: Filters) => {
      const params = new URLSearchParams();
      if (source.year) params.set("year", source.year);
      if (source.eventId) params.set("eventId", source.eventId);
      if (source.category) params.set("category", source.category);
      if (source.q.trim()) params.set("q", source.q.trim());
      return params;
    },
    []
  );

  const fetchPhotos = useCallback(
    async (source: Filters, cursor: string | null, append: boolean) => {
      const params = buildQuery(source);
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`/api/photos?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load photos");
      const data = await response.json();
      setPhotos((prev) =>
        append ? [...prev, ...(data.photos as PhotoDto[])] : data.photos
      );
      setNextCursor(data.nextCursor);
    },
    [buildQuery]
  );

  const applyFilters = useCallback(
    async (source: Filters) => {
      setLoading(true);
      try {
        await fetchPhotos(source, null, false);
        setAppliedFilters(source);
      } finally {
        setLoading(false);
      }
    },
    [fetchPhotos]
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || paginating) return;
    setPaginating(true);
    try {
      await fetchPhotos(appliedFilters, nextCursor, true);
    } finally {
      setPaginating(false);
    }
  }, [appliedFilters, fetchPhotos, nextCursor, paginating]);

  // IntersectionObserver-driven infinite scroll. Eats ~thousands of rows
  // gracefully because we only ever hold ~PAGE_SIZE photos in DOM per fetch
  // and the cursor-paginated API tops out the request size.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  const groups = useMemo(() => groupPhotosByMonth(photos), [photos]);
  const visibleCount = photos.length;
  const showingAll = !isFiltered && totalPhotoCount > 0;
  const yearChips = useMemo(
    () => years.slice().sort((a, b) => b - a),
    [years]
  );

  const handleQuickYear = (year: string) => {
    const next = { ...filters, year };
    setFilters(next);
    void applyFilters(next);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    void applyFilters(EMPTY_FILTERS);
  };

  return (
    <Card depth={1} className="p-6 md:p-8">
      <div className="space-y-2 mb-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Camera className="h-7 w-7 text-primary shrink-0" />
            <h1 className="text-primary leading-none">Photos</h1>
          </div>
          {totalPhotoCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {showingAll ? (
                <>
                  Browsing{" "}
                  <span className="font-semibold text-foreground">
                    {totalPhotoCount.toLocaleString()}
                  </span>{" "}
                  {totalPhotoCount === 1 ? "photo" : "photos"} from the SSE
                  archive.
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {visibleCount.toLocaleString()}
                  </span>{" "}
                  of {totalPhotoCount.toLocaleString()}
                </>
              )}
            </p>
          )}
        </div>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
          Moments from SSE events, projects, mentoring, and community
          gatherings — sorted by the date the photo was taken.
        </p>
      </div>

      {/* Year quick-chips. Active year is filled, the rest are outline. */}
      {yearChips.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <YearChip
            label="All years"
            active={!filters.year}
            onClick={() => handleQuickYear("")}
          />
          {yearChips.map((year) => (
            <YearChip
              key={year}
              label={String(year)}
              active={filters.year === String(year)}
              onClick={() => handleQuickYear(String(year))}
            />
          ))}
        </div>
      )}

      <PhotoFilters
        filters={filters}
        onChange={setFilters}
        onApply={() => void applyFilters(filters)}
        onClear={clearFilters}
        isFiltered={isFiltered}
        events={events}
        years={years}
        categories={categories}
        disabled={loading}
      />

      {loading ? (
        <PhotoGridSkeleton />
      ) : photos.length === 0 ? (
        <EmptyState isFiltered={isFiltered} onClear={clearFilters} />
      ) : (
        <>
          <div className="mt-6">
            <PhotoGrid
              groups={groups}
              onPhotoClick={(photo) => {
                const index = photos.findIndex(
                  (item) => item.id === photo.id
                );
                setSelectedIndex(index >= 0 ? index : null);
              }}
            />
          </div>

          <div
            ref={sentinelRef}
            aria-hidden
            className="h-1 w-full"
          />

          {paginating && (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more photos…
            </div>
          )}

          {!nextCursor && photos.length > 0 && (
            <p className="mt-10 text-center text-xs uppercase tracking-wider text-muted-foreground/70">
              ✦ End of the archive ✦
            </p>
          )}
        </>
      )}

      {selectedIndex !== null && (
        <PhotoLightbox
          photos={photos}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onClose={() => setSelectedIndex(null)}
          onRequestMore={nextCursor ? loadMore : undefined}
          paginating={paginating}
        />
      )}
    </Card>
  );
}

function YearChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm font-medium transition-all",
        "neo:rounded-base neo:border-2 neo:border-border",
        "clean:rounded-full clean:border clean:border-border/30",
        active
          ? "bg-primary text-primary-foreground neo:shadow-shadow"
          : "bg-secondary-background hover:bg-accent/15",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function PhotoGridSkeleton() {
  return (
    <div className="mt-6 space-y-8">
      {[0, 1].map((section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  isFiltered,
  onClear,
}: {
  isFiltered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-muted/40 p-4">
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-semibold">
        {isFiltered ? "No photos match those filters" : "No photos yet"}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        {isFiltered
          ? "Try widening the year, dropping the event filter, or searching for a different caption."
          : "When officers add photos to the library, they'll show up here."}
      </p>
      {isFiltered && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

export type PhotoMonthGroup = {
  key: string;
  label: string;
  year: number;
  photos: PhotoDto[];
};

function groupPhotosByMonth(photos: PhotoDto[]): PhotoMonthGroup[] {
  const map = new Map<string, PhotoMonthGroup>();
  for (const photo of photos) {
    const date = new Date(photo.sortDate);
    if (Number.isNaN(date.getTime())) continue;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const existing = map.get(key);
    if (existing) {
      existing.photos.push(photo);
    } else {
      map.set(key, {
        key,
        label: new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(date),
        year,
        photos: [photo],
      });
    }
  }
  // Photos are pre-sorted by sortDate desc, so map insertion order is correct.
  return Array.from(map.values());
}
