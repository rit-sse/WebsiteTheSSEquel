import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getPhotoImageUrl, PHOTO_CATEGORIES } from "@/lib/photos";
import { DashboardPhotosClient } from "./DashboardPhotosClient";

export default async function DashboardPhotosPage() {
  const auth = await getAuthLevel();
  if (!auth.isOfficer && !auth.isSeAdmin) {
    redirect("/dashboard");
  }

  const [photos, events] = await Promise.all([
    prisma.photo.findMany({
      take: 100,
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
  ]);

  return (
    <section className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-screen-xl space-y-6">
        <div>
          <h1 className="text-primary">Photo Library</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Upload and manage SSE photos for the public gallery.
          </p>
        </div>
        <DashboardPhotosClient
          initialPhotos={photos.map((photo) => ({
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
          events={events.map((event) => ({
            id: event.id,
            title: event.title,
            date: event.date.toISOString(),
          }))}
          categories={[...PHOTO_CATEGORIES]}
        />
      </div>
    </section>
  );
}
