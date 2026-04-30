import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getPhotoImageUrl, PHOTO_CATEGORIES } from "@/lib/photos";
import { PhotosClient, type PhotoDto, type PhotoEventOption } from "./PhotosClient";

export const metadata: Metadata = {
  title: "Historians",
  description: "Browse SSE event and community photos.",
};

const PAGE_SIZE = 90;

export default async function PhotosPage() {
  const [photos, events, years, totalPhotoCount] = await Promise.all([
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
    prisma.$queryRaw<{ year: number }[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM "sortDate")::int AS year
      FROM "Photo"
      WHERE "status" = 'published'
      ORDER BY year DESC
    `,
    prisma.photo.count({ where: { status: "published" } }),
  ]);

  const initialPhotos = photos.slice(0, PAGE_SIZE);

  return (
    <section className="mt-16 pb-16 w-full">
      <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 xl:px-8">
        <PhotosClient
          initialPhotos={initialPhotos.map(toPhotoDto)}
          initialNextCursor={
            photos.length > PAGE_SIZE
              ? encodePhotoCursor(initialPhotos[initialPhotos.length - 1])
              : null
          }
          events={events.map(toEventOption)}
          years={years.map((row) => Number(row.year))}
          categories={[...PHOTO_CATEGORIES]}
          totalPhotoCount={totalPhotoCount}
        />
      </div>
    </section>
  );
}

function encodePhotoCursor(photo: { sortDate: Date; id: number }) {
  return Buffer.from(
    JSON.stringify({
      sortDate: photo.sortDate.toISOString(),
      id: photo.id,
    })
  ).toString("base64url");
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
