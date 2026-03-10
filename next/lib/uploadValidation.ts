const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF87A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
const GIF89A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
const WEBP_RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_FORMAT_SIGNATURE = [0x57, 0x45, 0x42, 0x50];

export const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const IMAGE_EXTENSIONS_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function startsWithSignature(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectImageMimeType(bytes: Uint8Array): string | null {
  if (bytes.length >= JPEG_SIGNATURE.length && startsWithSignature(bytes, JPEG_SIGNATURE)) {
    return "image/jpeg";
  }

  if (bytes.length >= PNG_SIGNATURE.length && startsWithSignature(bytes, PNG_SIGNATURE)) {
    return "image/png";
  }

  if (
    (bytes.length >= GIF87A_SIGNATURE.length && startsWithSignature(bytes, GIF87A_SIGNATURE)) ||
    (bytes.length >= GIF89A_SIGNATURE.length && startsWithSignature(bytes, GIF89A_SIGNATURE))
  ) {
    return "image/gif";
  }

  if (
    bytes.length >= 12 &&
    startsWithSignature(bytes, WEBP_RIFF_SIGNATURE) &&
    startsWithSignature(bytes.subarray(8, 12), WEBP_FORMAT_SIGNATURE)
  ) {
    return "image/webp";
  }

  const prefix = new TextDecoder()
    .decode(bytes.subarray(0, Math.min(bytes.length, 512)))
    .trimStart()
    .toLowerCase();

  if (prefix.startsWith("<svg") || prefix.startsWith("<?xml") || prefix.includes("<svg")) {
    return "image/svg+xml";
  }

  return null;
}
