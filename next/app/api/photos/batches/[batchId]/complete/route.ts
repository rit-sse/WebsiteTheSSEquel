import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { s3Service } from "@/lib/services/s3Service";
import {
  computePhotoSortDate,
  isMissingS3ObjectError,
  keyBelongsToPhotoBatch,
  normalizePhotoCategory,
  parsePhotoDate,
  PHOTO_GALLERY_PREFIX,
  PHOTO_ORIGINAL_PREFIX,
  trimNullableText,
} from "@/lib/photos";

type CompletePhotoInput = {
  clientId?: unknown;
  originalKey?: unknown;
  galleryKey?: unknown;
  originalFilename?: unknown;
  originalMimeType?: unknown;
  originalSizeBytes?: unknown;
  galleryMimeType?: unknown;
  gallerySizeBytes?: unknown;
  caption?: unknown;
  altText?: unknown;
  exifTakenAt?: unknown;
  manualTakenAt?: unknown;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    eventId?: unknown;
    category?: unknown;
    batchManualTakenAt?: unknown;
    photos?: CompletePhotoInput[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!Array.isArray(body.photos) || body.photos.length === 0) {
    return NextResponse.json({ error: "photos are required" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" && body.eventId ? body.eventId : null;
  if (eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 400 });
    }
  }

  const category = normalizePhotoCategory(body.category);
  const batchManualTakenAt = parsePhotoDate(body.batchManualTakenAt);
  const created = [];
  const failed: Array<{ clientId: string; key: string; error: string }> = [];

  for (const input of body.photos) {
    const clientId = typeof input.clientId === "string" ? input.clientId : "";
    const originalKey = typeof input.originalKey === "string" ? input.originalKey : "";
    const galleryKey = typeof input.galleryKey === "string" ? input.galleryKey : "";
    const validationError = validateCompletePhoto(input, batchId);

    if (validationError) {
      failed.push({ clientId, key: originalKey || galleryKey, error: validationError });
      continue;
    }

    try {
      await Promise.all([
        s3Service.headObject(originalKey),
        s3Service.headObject(galleryKey),
      ]);
    } catch (error) {
      failed.push({
        clientId,
        key: originalKey || galleryKey,
        error: isMissingS3ObjectError(error)
          ? "Uploaded object was not found in S3"
          : "Failed to verify uploaded object",
      });
      continue;
    }

    const uploadedAt = new Date();
    const exifTakenAt = parsePhotoDate(input.exifTakenAt);
    const manualTakenAt =
      parsePhotoDate(input.manualTakenAt) ?? batchManualTakenAt;
    const sortDate = computePhotoSortDate({
      exifTakenAt,
      manualTakenAt,
      uploadedAt,
    });

    try {
      const photo = await prisma.photo.create({
        data: {
          originalKey,
          galleryKey,
          originalFilename: String(input.originalFilename),
          originalMimeType: String(input.originalMimeType),
          originalSizeBytes: Number(input.originalSizeBytes),
          galleryMimeType: "image/webp",
          gallerySizeBytes: Number(input.gallerySizeBytes),
          caption: trimNullableText(input.caption, 500),
          altText: trimNullableText(input.altText, 500),
          category,
          eventId,
          uploadedById: auth.userId ?? null,
          exifTakenAt,
          manualTakenAt,
          uploadedAt,
          sortDate,
          status: "published",
          batchId,
        },
        include: {
          event: {
            select: { id: true, title: true, date: true },
          },
        },
      });
      created.push(photo);
    } catch {
      failed.push({
        clientId,
        key: originalKey,
        error: "Failed to save photo metadata",
      });
    }
  }

  return NextResponse.json({
    created,
    failed,
  });
}

function validateCompletePhoto(
  input: CompletePhotoInput,
  batchId: string
): string | null {
  if (typeof input.clientId !== "string" || !input.clientId.trim()) {
    return "clientId is required";
  }
  if (
    typeof input.originalKey !== "string" ||
    !input.originalKey.startsWith(`${PHOTO_ORIGINAL_PREFIX}/`) ||
    !keyBelongsToPhotoBatch(input.originalKey, batchId)
  ) {
    return "Invalid original key";
  }
  if (
    typeof input.galleryKey !== "string" ||
    !input.galleryKey.startsWith(`${PHOTO_GALLERY_PREFIX}/`) ||
    !keyBelongsToPhotoBatch(input.galleryKey, batchId)
  ) {
    return "Invalid gallery key";
  }
  if (
    typeof input.originalFilename !== "string" ||
    !input.originalFilename.trim()
  ) {
    return "originalFilename is required";
  }
  if (typeof input.originalMimeType !== "string") {
    return "originalMimeType is required";
  }
  if (
    typeof input.originalSizeBytes !== "number" ||
    input.originalSizeBytes <= 0
  ) {
    return "originalSizeBytes is required";
  }
  if (input.galleryMimeType !== "image/webp") {
    return "galleryMimeType must be image/webp";
  }
  if (
    typeof input.gallerySizeBytes !== "number" ||
    input.gallerySizeBytes <= 0
  ) {
    return "gallerySizeBytes is required";
  }
  return null;
}
