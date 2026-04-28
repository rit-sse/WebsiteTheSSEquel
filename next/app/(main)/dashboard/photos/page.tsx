import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getPhotoImageUrl, PHOTO_CATEGORIES } from "@/lib/photos";
import { DashboardPhotosClient } from "./DashboardPhotosClient";

const INITIAL_LIMIT = 120;

export default async function DashboardPhotosPage() {
  const auth = await getAuthLevel();
  if (!auth.isOfficer && !auth.isSeAdmin) {
    redirect("/dashboard");
  }

  const [photos, events, totalPhotoCount] = await Promise.all([
    prisma.photo.findMany({
      take: INITIAL_LIMIT + 1,
      orderBy: [{ sortDate: "desc" }, { id: "desc" }],
      include: {
        event: { select: { id: true, title: true, date: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: { id: true, title: true, date: true },
    }),
    prisma.photo.count(),
  ]);

  const initialPhotos = photos.slice(0, INITIAL_LIMIT);
  const initialNextCursor =
    photos.length > INITIAL_LIMIT
      ? String(initialPhotos[initialPhotos.length - 1]?.id)
      : null;

  return (
    <section className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <DashboardPhotosClient
        initialPhotos={initialPhotos.map((photo) => ({
          id: photo.id,
          imageUrl: getPhotoImageUrl(photo.galleryKey),
          caption: photo.caption,
          altText: photo.altText,
          category: photo.category,
          eventId: photo.eventId,
          event: photo.event
            ? {
                id: photo.event.id,
                title: photo.event.title,
                date: photo.event.date.toISOString(),
              }
            : null,
          photoDate:
            photo.exifTakenAt?.toISOString() ??
            photo.manualTakenAt?.toISOString() ??
            null,
          uploadedAt: photo.uploadedAt.toISOString(),
          sortDate: photo.sortDate.toISOString(),
          status: photo.status,
          originalFilename: photo.originalFilename,
        }))}
        initialNextCursor={initialNextCursor}
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date.toISOString(),
        }))}
        categories={[...PHOTO_CATEGORIES]}
        totalPhotoCount={totalPhotoCount}
      />
    </section>
  );
}
