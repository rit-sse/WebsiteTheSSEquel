import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { s3Service } from "@/lib/services/s3Service";
import {
  ALLOWED_PHOTO_MIME_TYPES,
  buildPhotoObjectKeys,
  MAX_GALLERY_PHOTO_SIZE_BYTES,
  MAX_ORIGINAL_PHOTO_SIZE_BYTES,
  PHOTO_UPLOAD_LIMIT,
  PHOTO_UPLOAD_URL_TTL_SECONDS,
} from "@/lib/photos";

type UploadFileInput = {
  clientId?: unknown;
  filename?: unknown;
  originalContentType?: unknown;
  originalSizeBytes?: unknown;
  galleryContentType?: unknown;
  gallerySizeBytes?: unknown;
};

export async function POST(request: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { files?: UploadFileInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json({ error: "files are required" }, { status: 400 });
  }

  if (body.files.length > PHOTO_UPLOAD_LIMIT) {
    return NextResponse.json(
      { error: `Upload batches are limited to ${PHOTO_UPLOAD_LIMIT} files` },
      { status: 400 }
    );
  }

  const batchId = randomUUID();
  const uploads = [];

  for (const file of body.files) {
    const validationError = validateUploadFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { originalKey, galleryKey } = buildPhotoObjectKeys({
      batchId,
      filename: file.filename as string,
      originalContentType: file.originalContentType as string,
    });

    const [originalUploadUrl, galleryUploadUrl] = await Promise.all([
      s3Service.getSignedUploadUrl(
        originalKey,
        file.originalContentType as string,
        PHOTO_UPLOAD_URL_TTL_SECONDS
      ),
      s3Service.getSignedUploadUrl(
        galleryKey,
        "image/webp",
        PHOTO_UPLOAD_URL_TTL_SECONDS
      ),
    ]);

    uploads.push({
      clientId: file.clientId as string,
      originalKey,
      originalUploadUrl,
      galleryKey,
      galleryUploadUrl,
    });
  }

  return NextResponse.json({ batchId, uploads });
}

function validateUploadFile(file: UploadFileInput): string | null {
  if (typeof file.clientId !== "string" || !file.clientId.trim()) {
    return "Every file needs a clientId";
  }
  if (typeof file.filename !== "string" || !file.filename.trim()) {
    return "Every file needs a filename";
  }
  if (
    typeof file.originalContentType !== "string" ||
    !ALLOWED_PHOTO_MIME_TYPES.has(file.originalContentType)
  ) {
    return "Only JPEG, PNG, WEBP, and GIF originals are allowed";
  }
  if (file.originalContentType === "image/svg+xml") {
    return "SVG uploads are not allowed";
  }
  if (
    typeof file.originalSizeBytes !== "number" ||
    file.originalSizeBytes <= 0 ||
    file.originalSizeBytes > MAX_ORIGINAL_PHOTO_SIZE_BYTES
  ) {
    return "Original photos must be 25MB or smaller";
  }
  if (file.galleryContentType !== "image/webp") {
    return "Gallery images must be WebP";
  }
  if (
    typeof file.gallerySizeBytes !== "number" ||
    file.gallerySizeBytes <= 0 ||
    file.gallerySizeBytes > MAX_GALLERY_PHOTO_SIZE_BYTES
  ) {
    return "Gallery images must be 5MB or smaller";
  }
  return null;
}
