import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getS3Client, getBucketName } from "@/lib/S3Client";

export const dynamic = "force-dynamic";

const ALLOWED_KEY_PREFIXES = ["uploads/", "assets/library/"] as const;
const IMMUTABLE_PHOTO_GALLERY_PREFIX = "uploads/photos/gallery/";

/**
 * Image proxy for S3 uploads (profile pictures, library book covers, etc.).
 *
 * Security:  Only keys under approved upload prefixes are allowed.
 *            The raw S3 bucket URL is never exposed to the client.
 *
 * Caching:   5 min browser cache + 10 min stale-while-revalidate.
 *            Safe because every upload produces a new S3 key (timestamp-based).
 */
export async function GET(req: NextRequest) {
  // ── Validate key ─────────────────────────────────────────────────
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json(
      { error: "key parameter is required" },
      { status: 400 }
    );
  }

  // Only allow keys under known upload prefixes to prevent arbitrary S3 reads.
  if (!ALLOWED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return NextResponse.json({ error: "Invalid key" }, { status: 403 });
  }

  // ── Fetch from S3 via SDK (bucket is not public) ───────────────
  try {
    const s3 = getS3Client();
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      })
    );

    if (!response.Body) {
      return NextResponse.json(
        { error: "Image fetch failed" },
        { status: 404 }
      );
    }

    const body = response.Body;
    const stream =
      typeof body.transformToWebStream === "function"
        ? body.transformToWebStream()
        : typeof body.transformToByteArray === "function"
          ? new ReadableStream({
              async start(controller) {
                controller.enqueue(await body.transformToByteArray());
                controller.close();
              },
            })
          : null;

    if (!stream) {
      return NextResponse.json(
        { error: "Image fetch failed" },
        { status: 500 }
      );
    }

    return new NextResponse(stream as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Cache-Control": key.startsWith(IMMUTABLE_PHOTO_GALLERY_PREFIX)
          ? "public, max-age=31536000, immutable"
          : "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    if (err.name === "NoSuchKey") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    const localResponse = await tryReadLocalDevelopmentImage(key);
    if (localResponse) return localResponse;

    console.error("S3 image fetch error:", err);
    return NextResponse.json({ error: "Image fetch failed" }, { status: 500 });
  }
}

async function tryReadLocalDevelopmentImage(key: string) {
  if (process.env.NODE_ENV === "production") return null;

  try {
    const publicRoot = path.join(process.cwd(), "public");
    const resolved = path.resolve(publicRoot, key);
    if (!resolved.startsWith(publicRoot + path.sep)) return null;

    const data = await readFile(resolved);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentTypeForKey(key),
        "Cache-Control": key.startsWith(IMMUTABLE_PHOTO_GALLERY_PREFIX)
          ? "public, max-age=31536000, immutable"
          : "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return null;
  }
}

function contentTypeForKey(key: string) {
  const extension = path.extname(key).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  return "application/octet-stream";
}
