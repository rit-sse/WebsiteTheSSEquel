import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { s3Service } from "@/lib/services/s3Service";
import {
  computePhotoSortDate,
  isMissingS3ObjectError,
  normalizePhotoCategory,
  parsePhotoDate,
  trimNullableText,
} from "@/lib/photos";
import { detectImageMimeType } from "@/lib/uploadValidation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = Number.parseInt(id, 10);
  if (!Number.isInteger(requestId)) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const existing = await prisma.photoUploadRequest.findUnique({
    where: { id: requestId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: "Request has already been reviewed" },
      { status: 409 },
    );
  }

  if (body.action === "reject") {
    const rejected = await prisma.photoUploadRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        reviewedById: auth.userId ?? null,
        reviewedAt: new Date(),
        reviewNotes: trimNullableText(body.reviewNotes, 1000),
      },
    });
    return NextResponse.json(rejected);
  }

  const eventId =
    typeof body.eventId === "string" && body.eventId ? body.eventId : null;
  if (eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 400 });
    }
  }

  try {
    const [originalHead, galleryHead, originalBytes, galleryBytes] =
      await Promise.all([
        s3Service.headObject(existing.originalKey),
        s3Service.headObject(existing.galleryKey),
        s3Service.getObjectBytes(existing.originalKey),
        s3Service.getObjectBytes(existing.galleryKey),
      ]);
    const originalMime = detectImageMimeType(originalBytes);
    const galleryMime = detectImageMimeType(galleryBytes);

    if (originalMime !== existing.originalMimeType) {
      return NextResponse.json(
        { error: "Original file type does not match its contents" },
        { status: 415 },
      );
    }
    if (galleryMime !== "image/webp") {
      return NextResponse.json(
        { error: "Gallery file must be WebP" },
        { status: 415 },
      );
    }
    if (
      typeof originalHead.contentLength === "number" &&
      originalHead.contentLength !== existing.originalSizeBytes
    ) {
      return NextResponse.json(
        { error: "Original file size changed after upload" },
        { status: 400 },
      );
    }
    if (
      typeof galleryHead.contentLength === "number" &&
      galleryHead.contentLength !== existing.gallerySizeBytes
    ) {
      return NextResponse.json(
        { error: "Gallery file size changed after upload" },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: isMissingS3ObjectError(error)
          ? "Uploaded object was not found in S3"
          : "Failed to verify uploaded object",
      },
      { status: 502 },
    );
  }

  const uploadedAt = new Date();
  const manualTakenAt =
    "manualTakenAt" in body
      ? parsePhotoDate(body.manualTakenAt)
      : existing.manualTakenAt;
  const exifTakenAt = existing.exifTakenAt;
  const sortDate = computePhotoSortDate({
    exifTakenAt,
    manualTakenAt,
    uploadedAt,
  });

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const current = await tx.photoUploadRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      });
      if (!current || current.status !== "pending") {
        throw new Error("Request has already been reviewed");
      }

      const photo = await tx.photo.create({
        data: {
          originalKey: existing.originalKey,
          galleryKey: existing.galleryKey,
          originalFilename: existing.originalFilename,
          originalMimeType: existing.originalMimeType,
          originalSizeBytes: existing.originalSizeBytes,
          galleryMimeType: "image/webp",
          gallerySizeBytes: existing.gallerySizeBytes,
          caption:
            "caption" in body
              ? trimNullableText(body.caption, 500)
              : existing.caption,
          altText:
            "altText" in body
              ? trimNullableText(body.altText, 500)
              : existing.altText,
          category:
            "category" in body
              ? normalizePhotoCategory(body.category)
              : existing.category,
          eventId,
          uploadedById: auth.userId ?? null,
          exifTakenAt,
          manualTakenAt,
          uploadedAt,
          sortDate,
          status: "published",
          batchId: existing.batchId,
        },
      });

      return tx.photoUploadRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          reviewedById: auth.userId ?? null,
          reviewedAt: new Date(),
          reviewNotes: trimNullableText(body.reviewNotes, 1000),
          publishedPhotoId: photo.id,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Request has already been reviewed"
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json(result);
}
