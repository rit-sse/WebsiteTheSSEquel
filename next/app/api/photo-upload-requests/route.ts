import { NextRequest, NextResponse } from "next/server";
import { PhotoUploadRequestStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { getPhotoImageUrl } from "@/lib/photos";

export async function GET(request: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const requestedLimit = Number.parseInt(
    searchParams.get("limit") ?? "100",
    10,
  );
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 200)
    : 100;

  const where =
    status === "pending" || status === "approved" || status === "rejected"
      ? { status: status as PhotoUploadRequestStatus }
      : {};

  const requests = await prisma.photoUploadRequest.findMany({
    where,
    take: limit,
    orderBy: [{ uploadedAt: "desc" }, { id: "desc" }],
    include: {
      event: { select: { id: true, title: true, date: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    requests: requests.map((item) => ({
      id: item.id,
      imageUrl: getPhotoImageUrl(item.galleryKey),
      caption: item.caption,
      altText: item.altText,
      category: item.category,
      eventId: item.eventId,
      event: item.event
        ? {
            id: item.event.id,
            title: item.event.title,
            date: item.event.date.toISOString(),
          }
        : null,
      submitterName: item.submitterName,
      submitterEmail: item.submitterEmail,
      submitterNote: item.submitterNote,
      originalFilename: item.originalFilename,
      originalMimeType: item.originalMimeType,
      originalSizeBytes: item.originalSizeBytes,
      gallerySizeBytes: item.gallerySizeBytes,
      photoDate:
        item.exifTakenAt?.toISOString() ??
        item.manualTakenAt?.toISOString() ??
        null,
      uploadedAt: item.uploadedAt.toISOString(),
      status: item.status,
      reviewNotes: item.reviewNotes,
      reviewedAt: item.reviewedAt?.toISOString() ?? null,
      reviewedBy: item.reviewedBy,
      publishedPhotoId: item.publishedPhotoId,
    })),
  });
}
