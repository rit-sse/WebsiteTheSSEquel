import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveClientIp } from "@/lib/middlewares/rateLimit";
import { s3Service } from "@/lib/services/s3Service";
import {
  isMissingS3ObjectError,
  keyBelongsToPhotoRequestBatch,
  MAX_GALLERY_PHOTO_SIZE_BYTES,
  MAX_ORIGINAL_PHOTO_SIZE_BYTES,
  normalizePhotoCategory,
  parsePhotoDate,
  PHOTO_REQUEST_GALLERY_PREFIX,
  PHOTO_REQUEST_ORIGINAL_PREFIX,
  PHOTO_REQUEST_UPLOAD_LIMIT,
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
  { params }: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await params;
  let body: {
    requestToken?: unknown;
    submitterName?: unknown;
    submitterEmail?: unknown;
    submitterNote?: unknown;
    website?: unknown;
    eventId?: unknown;
    category?: unknown;
    batchManualTakenAt?: unknown;
    photos?: CompletePhotoInput[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.requestToken !== "string" || !body.requestToken.trim()) {
    return NextResponse.json(
      { error: "requestToken is required" },
      { status: 400 },
    );
  }
  if (!isValidBatchToken(batchId, body.requestToken)) {
    return NextResponse.json(
      { error: "Invalid request token" },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.photos) || body.photos.length === 0) {
    return NextResponse.json({ error: "photos are required" }, { status: 400 });
  }
  if (body.photos.length > PHOTO_REQUEST_UPLOAD_LIMIT) {
    return NextResponse.json(
      {
        error: `Upload requests are limited to ${PHOTO_REQUEST_UPLOAD_LIMIT} files`,
      },
      { status: 400 },
    );
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

  const category = normalizePhotoCategory(body.category);
  const batchManualTakenAt = parsePhotoDate(body.batchManualTakenAt);
  const created = [];
  const failed: Array<{ clientId: string; key: string; error: string }> = [];
  const uploadedAt = new Date();
  const ipHash = hashIp(resolveClientIp(request));

  for (const input of body.photos) {
    const clientId = typeof input.clientId === "string" ? input.clientId : "";
    const originalKey =
      typeof input.originalKey === "string" ? input.originalKey : "";
    const galleryKey =
      typeof input.galleryKey === "string" ? input.galleryKey : "";
    const validationError = validateCompletePhoto(input, batchId);

    if (validationError) {
      failed.push({
        clientId,
        key: originalKey || galleryKey,
        error: validationError,
      });
      continue;
    }

    try {
      const [originalHead, galleryHead] = await Promise.all([
        s3Service.headObject(originalKey),
        s3Service.headObject(galleryKey),
      ]);
      const headError = validateHeadObjects(input, originalHead, galleryHead);
      if (headError) {
        failed.push({
          clientId,
          key: originalKey || galleryKey,
          error: headError,
        });
        continue;
      }
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

    const exifTakenAt = parsePhotoDate(input.exifTakenAt);
    const manualTakenAt =
      parsePhotoDate(input.manualTakenAt) ?? batchManualTakenAt;

    try {
      const requestRecord = await prisma.photoUploadRequest.create({
        data: {
          requestToken: body.requestToken,
          batchId,
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
          submitterName: trimNullableText(body.submitterName, 100),
          submitterEmail: trimNullableText(body.submitterEmail, 255),
          submitterNote: trimNullableText(body.submitterNote, 1000),
          submitterIpHash: ipHash,
          exifTakenAt,
          manualTakenAt,
          uploadedAt,
          status: "pending",
        },
        select: { id: true },
      });
      created.push({ id: requestRecord.id, clientId });
    } catch {
      failed.push({
        clientId,
        key: originalKey,
        error: "Failed to save upload request",
      });
    }
  }

  return NextResponse.json({ created, failed });
}

function validateCompletePhoto(
  input: CompletePhotoInput,
  batchId: string,
): string | null {
  if (typeof input.clientId !== "string" || !input.clientId.trim()) {
    return "clientId is required";
  }
  if (
    typeof input.originalKey !== "string" ||
    !input.originalKey.startsWith(`${PHOTO_REQUEST_ORIGINAL_PREFIX}/`) ||
    !keyBelongsToPhotoRequestBatch(input.originalKey, batchId)
  ) {
    return "Invalid original key";
  }
  if (
    typeof input.galleryKey !== "string" ||
    !input.galleryKey.startsWith(`${PHOTO_REQUEST_GALLERY_PREFIX}/`) ||
    !keyBelongsToPhotoRequestBatch(input.galleryKey, batchId)
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
    input.originalSizeBytes <= 0 ||
    input.originalSizeBytes > MAX_ORIGINAL_PHOTO_SIZE_BYTES
  ) {
    return "originalSizeBytes is invalid";
  }
  if (input.galleryMimeType !== "image/webp") {
    return "galleryMimeType must be image/webp";
  }
  if (
    typeof input.gallerySizeBytes !== "number" ||
    input.gallerySizeBytes <= 0 ||
    input.gallerySizeBytes > MAX_GALLERY_PHOTO_SIZE_BYTES
  ) {
    return "gallerySizeBytes is invalid";
  }
  return null;
}

function validateHeadObjects(
  input: CompletePhotoInput,
  originalHead: { contentType?: string; contentLength?: number },
  galleryHead: { contentType?: string; contentLength?: number },
) {
  if (
    originalHead.contentType &&
    originalHead.contentType !== input.originalMimeType
  ) {
    return "Original file type does not match uploaded object";
  }
  if (galleryHead.contentType && galleryHead.contentType !== "image/webp") {
    return "Gallery file type does not match uploaded object";
  }
  if (
    typeof originalHead.contentLength === "number" &&
    originalHead.contentLength !== input.originalSizeBytes
  ) {
    return "Original file size does not match uploaded object";
  }
  if (
    typeof galleryHead.contentLength === "number" &&
    galleryHead.contentLength !== input.gallerySizeBytes
  ) {
    return "Gallery file size does not match uploaded object";
  }
  return null;
}

function hashIp(ip: string) {
  const salt =
    process.env.PHOTO_UPLOAD_REQUEST_IP_HASH_SALT ?? "photo-upload-request";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function isValidBatchToken(batchId: string, token: string) {
  const [tokenBatchId, signature] = token.split(".");
  if (tokenBatchId !== batchId || !signature) return false;
  const secret = process.env.NEXTAUTH_SECRET ?? "photo-upload-request-dev";
  const expected = createHmac("sha256", secret).update(batchId).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
