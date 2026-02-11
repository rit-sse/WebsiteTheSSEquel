/**
 * Utility functions for working with S3 URLs
 */

/**
 * Constructs a public S3 URL from a key
 */
export function getPublicS3Url(key: string): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME!;
  const region = process.env.AWS_S3_REGION!;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Extracts the S3 key from a public S3 URL
 */
export function getKeyFromS3Url(url: string): string | null {
  const bucket = process.env.AWS_S3_BUCKET_NAME!;
  const region = process.env.AWS_S3_REGION!;
  const pattern = new RegExp(`https://${bucket}\\.s3\\.${region}\\.amazonaws\\.com/(.+)`);
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Checks if a string is an S3 key (not a full URL)
 */
export function isS3Key(imageValue: string): boolean {
  return !imageValue.startsWith('http://') && !imageValue.startsWith('https://');
}

/**
 * Gets the display URL for an image, handling both S3 keys and full URLs
 */
export function getImageUrl(imageValue: string | null | undefined): string {
  if (!imageValue) {
    return "https://source.boringavatars.com/beam/";
  }

  // If it's already a full URL, return it
  if (!isS3Key(imageValue)) {
    return imageValue;
  }

  // If it's a key, construct the public URL
  return getPublicS3Url(imageValue);
}
