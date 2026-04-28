"use client";

import { useCallback, useState } from "react";
import { Camera, ImagePlus, Library } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoBatchUploader } from "./PhotoBatchUploader";
import { PhotoManagementTable, type ManagedPhoto } from "./PhotoManagementTable";

export type DashboardPhotoEvent = {
  id: string;
  title: string;
  date: string;
};

export function DashboardPhotosClient({
  initialPhotos,
  initialNextCursor,
  events,
  categories,
  totalPhotoCount,
}: {
  initialPhotos: ManagedPhoto[];
  initialNextCursor: string | null;
  events: DashboardPhotoEvent[];
  categories: string[];
  totalPhotoCount: number;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor
  );
  const [tab, setTab] = useState<"upload" | "manage">("upload");
  const [count, setCount] = useState(totalPhotoCount);

  const refreshPhotos = useCallback(async () => {
    const response = await fetch("/api/photos?admin=true&limit=100");
    if (!response.ok) return;
    const data = await response.json();
    setPhotos(
      data.photos.map((photo: ManagedPhoto & { event: DashboardPhotoEvent | null }) => ({
        ...photo,
        eventId: photo.event?.id ?? null,
      }))
    );
    setNextCursor(data.nextCursor ?? null);
  }, []);

  const handleBatchComplete = useCallback(
    async (createdCount: number) => {
      // Refresh the manage list and bump the count optimistically. Then
      // hop the user to "Manage" so they see the freshly-uploaded photos
      // without having to click the tab themselves.
      await refreshPhotos();
      setCount((prev) => prev + createdCount);
      if (createdCount > 0) setTab("manage");
    },
    [refreshPhotos]
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    const params = new URLSearchParams({
      admin: "true",
      limit: "100",
      cursor: nextCursor,
    });
    const response = await fetch(`/api/photos?${params.toString()}`);
    if (!response.ok) return;
    const data = await response.json();
    setPhotos((prev) => [
      ...prev,
      ...data.photos.map(
        (photo: ManagedPhoto & { event: DashboardPhotoEvent | null }) => ({
          ...photo,
          eventId: photo.event?.id ?? null,
        })
      ),
    ]);
    setNextCursor(data.nextCursor ?? null);
  }, [nextCursor]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <Library className="h-7 w-7 text-primary shrink-0" />
          <div>
            <h1 className="text-primary leading-none">Photo Library</h1>
            <p className="mt-2 text-base text-muted-foreground max-w-xl">
              Upload and curate the photos that appear on the public gallery.
              Originals are preserved; optimized WebP copies are served.
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {count.toLocaleString()}
          </span>{" "}
          {count === 1 ? "photo" : "photos"} in the library
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "upload" | "manage")}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <PhotoBatchUploader
            events={events}
            categories={categories}
            onBatchComplete={handleBatchComplete}
          />
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <PhotoManagementTable
            photos={photos}
            events={events}
            categories={categories}
            onChange={refreshPhotos}
            onLoadMore={nextCursor ? loadMore : undefined}
            hasMore={Boolean(nextCursor)}
            totalPhotoCount={count}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
