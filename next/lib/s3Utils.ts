/**
 * Utility functions for working with S3 URLs
 */

/**
 * Constructs a public S3 URL from a key
 */
export function getPublicS3Url(key: string): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_S3_REGION || process.env.NEXT_PUBLIC_AWS_S3_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Extracts the S3 key from a public S3 URL
 */
export function getKeyFromS3Url(url: string): string | null {
  const bucket = process.env.AWS_S3_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_S3_REGION || process.env.NEXT_PUBLIC_AWS_S3_REGION;
  const pattern = new RegExp(`https://${bucket}\\.s3\\.${region}\\.amazonaws\\.com/(.+)`);
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Checks if a string is an S3 key (not a full URL)
 */
export function isS3Key(imageValue: string): boolean {
  if (!imageValue) return false;
  // Treat absolute/protocol-relative/app-relative/data URLs as URLs, not S3 keys
  if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) return false;
  if (imageValue.startsWith("//") || imageValue.startsWith("/")) return false;
  if (imageValue.startsWith("data:")) return false;
  return true;
}

/**
 * Normalizes an image value into an S3 key when possible.
 * Supports raw keys, public S3 URLs, and `/api/aws/image?key=...` proxy URLs.
 */
export function normalizeToS3Key(imageValue: string | null | undefined): string | null {
  if (!imageValue) return null;

  if (isS3Key(imageValue)) return imageValue;

  const fromPublicUrl = getKeyFromS3Url(imageValue);
  if (fromPublicUrl) return fromPublicUrl;

  try {
    // Support relative URLs (e.g. `/api/aws/image?key=...`) by using a base URL.
    const parsed = new URL(imageValue, "http://localhost");
    if (parsed.pathname !== "/api/aws/image") return null;
    return parsed.searchParams.get("key");
  } catch {
    return null;
  }
}

/**
 * Gets the display URL for an image, handling both S3 keys and full URLs
 */
export function getImageUrl(imageValue: string | null | undefined): string {
  if (!imageValue) return "https://source.boringavatars.com/beam/";

  // Already a full URL (Google, boring avatars, etc.) return as-is
  if (!isS3Key(imageValue)) return imageValue;

  // ALWAYS proxy through our API (server AND client)
  // This ensures no-cache headers are applied
  return `/api/aws/image?key=${encodeURIComponent(imageValue)}`;
}

/**
 * Resolves a user's profile image from their DB fields into a display-ready URL.
 * Use this in API routes so clients always receive a usable image URL
 * without needing to call getImageUrl() themselves.
 *
 * Priority: profileImageKey (S3) > googleImageURL (OAuth) > null
 */
export function resolveUserImage(
  profileImageKey: string | null | undefined,
  googleImageURL: string | null | undefined,
): string | null {
  const raw = profileImageKey ?? googleImageURL ?? null;
  if (!raw) return null;
  return getImageUrl(raw);
}
