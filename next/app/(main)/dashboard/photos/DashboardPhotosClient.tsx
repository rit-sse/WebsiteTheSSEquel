"use client";

import { useCallback, useState } from "react";
import { Camera, ImagePlus, Inbox } from "lucide-react";
import { NeoCard, NeoCardContent } from "@/components/ui/neo-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoBatchUploader } from "./PhotoBatchUploader";
import {
  PhotoManagementTable,
  type ManagedPhoto,
} from "./PhotoManagementTable";
import {
  PhotoRequestReviewTable,
  type PhotoUploadRequestDto,
} from "./PhotoRequestReviewTable";

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
  initialRequests,
}: {
  initialPhotos: ManagedPhoto[];
  initialNextCursor: string | null;
  events: DashboardPhotoEvent[];
  categories: string[];
  totalPhotoCount: number;
  initialRequests: PhotoUploadRequestDto[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [requests, setRequests] = useState(initialRequests);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor,
  );
  const [tab, setTab] = useState<"upload" | "manage" | "requests">("upload");
  const [count, setCount] = useState(totalPhotoCount);

  const refreshPhotos = useCallback(async () => {
    const response = await fetch("/api/photos?admin=true&limit=100");
    if (!response.ok) return;
    const data = await response.json();
    setPhotos(
      data.photos.map(
        (photo: ManagedPhoto & { event: DashboardPhotoEvent | null }) => ({
          ...photo,
          eventId: photo.event?.id ?? null,
        }),
      ),
    );
    setNextCursor(data.nextCursor ?? null);
  }, []);

  const refreshRequests = useCallback(async () => {
    const response = await fetch(
      "/api/photo-upload-requests?status=pending&limit=100",
    );
    if (!response.ok) return;
    const data = await response.json();
    setRequests(data.requests);
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
    [refreshPhotos],
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
        }),
      ),
    ]);
    setNextCursor(data.nextCursor ?? null);
  }, [nextCursor]);

  return (
    <NeoCard depth={1}>
      <NeoCardContent className="p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-primary leading-none">Historians</h1>
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
          onValueChange={(value) => setTab(value as typeof tab)}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Requests
              {requests.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <PhotoBatchUploader
              events={events}
              categories={categories}
              onComplete={handleBatchComplete}
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

          <TabsContent value="requests" className="space-y-4">
            <PhotoRequestReviewTable
              requests={requests}
              events={events}
              categories={categories}
              onChange={async () => {
                await Promise.all([refreshRequests(), refreshPhotos()]);
              }}
            />
          </TabsContent>
        </Tabs>
      </NeoCardContent>
    </NeoCard>
  );
}
