import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { getPhotoImageUrl } from "@/lib/photos";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const requestedLimit = Number.parseInt(
    searchParams.get("limit") ?? String(DEFAULT_LIMIT),
    10
  );
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const cursor = searchParams.get("cursor");
  const cursorId = cursor ? Number.parseInt(cursor, 10) : null;
  const includeHidden = searchParams.get("admin") === "true";

  if (includeHidden) {
    const auth = await resolveAuthLevelFromRequest(request);
    if (!auth.isOfficer && !auth.isSeAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const where: any = includeHidden ? {} : { status: "published" };
  const eventId = searchParams.get("eventId");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();
  const year = Number.parseInt(searchParams.get("year") ?? "", 10);

  if (eventId) where.eventId = eventId;
  if (category) where.category = category;
  if (Number.isInteger(year) && year >= 1900 && year <= 3000) {
    where.sortDate = {
      gte: new Date(Date.UTC(year, 0, 1)),
      lt: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }
  if (q) {
    where.OR = [
      { caption: { contains: q, mode: "insensitive" } },
      { altText: { contains: q, mode: "insensitive" } },
      { originalFilename: { contains: q, mode: "insensitive" } },
    ];
  }

  const photos = await prisma.photo.findMany({
    where,
    take: limit + 1,
    ...(cursorId && Number.isInteger(cursorId)
      ? { cursor: { id: cursorId }, skip: 1 }
      : {}),
    orderBy: [{ sortDate: "desc" }, { id: "desc" }],
    include: {
      event: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const hasMore = photos.length > limit;
  const page = hasMore ? photos.slice(0, limit) : photos;

  return NextResponse.json({
    photos: page.map((photo) => ({
      id: photo.id,
      imageUrl: getPhotoImageUrl(photo.galleryKey),
      caption: photo.caption,
      altText: photo.altText,
      category: photo.category,
      event: photo.event
        ? {
            id: photo.event.id,
            title: photo.event.title,
            date: photo.event.date.toISOString(),
          }
        : null,
      uploadedBy: photo.uploadedBy,
      photoDate:
        photo.exifTakenAt?.toISOString() ??
        photo.manualTakenAt?.toISOString() ??
        null,
      uploadedAt: photo.uploadedAt.toISOString(),
      sortDate: photo.sortDate.toISOString(),
      status: photo.status,
      originalFilename: photo.originalFilename,
    })),
    nextCursor: hasMore ? String(page[page.length - 1]?.id) : null,
  });
}
