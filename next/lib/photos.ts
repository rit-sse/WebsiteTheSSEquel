import { randomUUID } from "node:crypto";

export const PHOTO_ORIGINAL_PREFIX = "uploads/photos/originals";
export const PHOTO_GALLERY_PREFIX = "uploads/photos/gallery";
export const PHOTO_REQUEST_ORIGINAL_PREFIX =
  "uploads/photos/requests/originals";
export const PHOTO_REQUEST_GALLERY_PREFIX = "uploads/photos/requests/gallery";
export const PHOTO_UPLOAD_LIMIT = 500;
export const PHOTO_REQUEST_UPLOAD_LIMIT = 20;
export const MAX_ORIGINAL_PHOTO_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_GALLERY_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const PHOTO_UPLOAD_URL_TTL_SECONDS = 10 * 60;

export const PHOTO_STATUSES = ["published", "hidden"] as const;
export type PhotoStatus = (typeof PHOTO_STATUSES)[number];

export const PHOTO_CATEGORIES = [
  "general",
  "events",
  "projects",
  "mentoring",
  "social",
  "outreach",
] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const ALLOWED_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const PHOTO_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type DateSource = {
  exifTakenAt?: Date | string | null;
  manualTakenAt?: Date | string | null;
  uploadedAt?: Date | string | null;
};

export function sanitizePhotoFilename(filename: string): string {
  const sanitized = filename
    .trim()
    .replace(/[/\\]/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
  return sanitized || "photo";
}

export function parsePhotoDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function computePhotoSortDate(source: DateSource): Date {
  const exif = normalizeDate(source.exifTakenAt);
  if (exif) return exif;

  const manual = normalizeDate(source.manualTakenAt);
  if (manual) return manual;

  return normalizeDate(source.uploadedAt) ?? new Date();
}

export function normalizePhotoCategory(value: unknown): string {
  if (typeof value !== "string") return "general";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "general";
  if (!/^[a-z0-9_-]{1,80}$/.test(normalized)) return "general";
  return normalized;
}

export function normalizePhotoStatus(value: unknown): PhotoStatus | null {
  if (typeof value !== "string") return null;
  return PHOTO_STATUSES.includes(value as PhotoStatus)
    ? (value as PhotoStatus)
    : null;
}

export function getPhotoImageUrl(key: string): string {
  return `/api/aws/image?key=${encodeURIComponent(key)}`;
}

export function buildPhotoObjectKeys(input: {
  batchId: string;
  filename: string;
  originalContentType: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const year = String(now.getUTCFullYear());
  const id = randomUUID();
  const extension = PHOTO_EXTENSION_BY_MIME[input.originalContentType] ?? "jpg";
  const sanitized = sanitizePhotoFilename(input.filename);

  return {
    originalKey: `${PHOTO_ORIGINAL_PREFIX}/${year}/${input.batchId}/${id}-${sanitized}.${extension}`,
    galleryKey: `${PHOTO_GALLERY_PREFIX}/${year}/${input.batchId}/${id}.webp`,
  };
}

export function buildPhotoRequestObjectKeys(input: {
  batchId: string;
  filename: string;
  originalContentType: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const year = String(now.getUTCFullYear());
  const id = randomUUID();
  const extension = PHOTO_EXTENSION_BY_MIME[input.originalContentType] ?? "jpg";
  const sanitized = sanitizePhotoFilename(input.filename);

  return {
    originalKey: `${PHOTO_REQUEST_ORIGINAL_PREFIX}/${year}/${input.batchId}/${id}-${sanitized}.${extension}`,
    galleryKey: `${PHOTO_REQUEST_GALLERY_PREFIX}/${year}/${input.batchId}/${id}.webp`,
  };
}

export function keyBelongsToPhotoBatch(key: string, batchId: string): boolean {
  return (
    (key.startsWith(`${PHOTO_ORIGINAL_PREFIX}/`) ||
      key.startsWith(`${PHOTO_GALLERY_PREFIX}/`)) &&
    key.includes(`/${batchId}/`)
  );
}

export function keyBelongsToPhotoRequestBatch(
  key: string,
  batchId: string,
): boolean {
  return (
    (key.startsWith(`${PHOTO_REQUEST_ORIGINAL_PREFIX}/`) ||
      key.startsWith(`${PHOTO_REQUEST_GALLERY_PREFIX}/`)) &&
    key.includes(`/${batchId}/`)
  );
}

export function isMissingS3ObjectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const code =
    "$metadata" in error ? (error as any).$metadata?.httpStatusCode : null;
  return name === "NoSuchKey" || name === "NotFound" || code === 404;
}

export function trimNullableText(value: unknown, maxLength: number) {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
