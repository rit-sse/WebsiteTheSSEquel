import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getPhotoImageUrl, PHOTO_CATEGORIES } from "@/lib/photos";
import { PhotosClient, type PhotoDto, type PhotoEventOption } from "./PhotosClient";

export const metadata: Metadata = {
  title: "Photos",
  description: "Browse SSE event and community photos.",
};

const PAGE_SIZE = 60;

export default async function PhotosPage() {
  const [photos, events, years] = await Promise.all([
    prisma.photo.findMany({
      where: { status: "published" },
      take: PAGE_SIZE + 1,
      orderBy: [{ sortDate: "desc" }, { id: "desc" }],
      include: {
        event: { select: { id: true, title: true, date: true } },
      },
    }),
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: { id: true, title: true, date: true },
    }),
    prisma.photo.findMany({
      where: { status: "published" },
      distinct: ["sortDate"],
      select: { sortDate: true },
      orderBy: { sortDate: "desc" },
    }),
  ]);

  const initialPhotos = photos.slice(0, PAGE_SIZE);

  return (
    <section className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-screen-xl space-y-6">
        <div>
          <h1 className="text-primary">Photos</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Browse moments from SSE events, projects, mentoring, and community
            gatherings.
          </p>
        </div>
        <PhotosClient
          initialPhotos={initialPhotos.map(toPhotoDto)}
          initialNextCursor={
            photos.length > PAGE_SIZE
              ? String(initialPhotos[initialPhotos.length - 1]?.id)
              : null
          }
          events={events.map(toEventOption)}
          years={Array.from(
            new Set(years.map((row) => row.sortDate.getUTCFullYear()))
          )}
          categories={[...PHOTO_CATEGORIES]}
        />
      </div>
    </section>
  );
}

function toEventOption(event: {
  id: string;
  title: string;
  date: Date;
}): PhotoEventOption {
  return {
    id: event.id,
    title: event.title,
    date: event.date.toISOString(),
  };
}

function toPhotoDto(photo: {
  id: number;
  galleryKey: string;
  caption: string | null;
  altText: string | null;
  category: string;
  event: { id: string; title: string; date: Date } | null;
  exifTakenAt: Date | null;
  manualTakenAt: Date | null;
  uploadedAt: Date;
  sortDate: Date;
  originalFilename: string;
}): PhotoDto {
  return {
    id: photo.id,
    imageUrl: getPhotoImageUrl(photo.galleryKey),
    caption: photo.caption,
    altText: photo.altText,
    category: photo.category,
    event: photo.event ? toEventOption(photo.event) : null,
    photoDate:
      photo.exifTakenAt?.toISOString() ??
      photo.manualTakenAt?.toISOString() ??
      null,
    uploadedAt: photo.uploadedAt.toISOString(),
    sortDate: photo.sortDate.toISOString(),
    originalFilename: photo.originalFilename,
  };
}
