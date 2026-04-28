"use client";

import { useState } from "react";
import { PhotoBatchUploader } from "./PhotoBatchUploader";
import { PhotoManagementTable, type ManagedPhoto } from "./PhotoManagementTable";

export type DashboardPhotoEvent = {
  id: string;
  title: string;
  date: string;
};

export function DashboardPhotosClient({
  initialPhotos,
  events,
  categories,
}: {
  initialPhotos: ManagedPhoto[];
  events: DashboardPhotoEvent[];
  categories: string[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);

  async function refreshPhotos() {
    const response = await fetch("/api/photos?admin=true&limit=100");
    if (!response.ok) return;
    const data = await response.json();
    setPhotos(
      data.photos.map((photo: any) => ({
        ...photo,
        eventId: photo.event?.id ?? null,
      }))
    );
  }

  return (
    <div className="space-y-8">
      <PhotoBatchUploader
        events={events}
        categories={categories}
        onBatchComplete={refreshPhotos}
      />
      <PhotoManagementTable
        photos={photos}
        events={events}
        categories={categories}
        onChange={refreshPhotos}
      />
    </div>
  );
}
