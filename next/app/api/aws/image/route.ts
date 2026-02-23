import { NextRequest, NextResponse } from "next/server";
import { getPublicS3Url } from "@/lib/s3Utils";

export const dynamic = "force-dynamic";

/**
 * Image proxy for S3 profile pictures.
 *
 * Security:  Only keys under the `uploads/` prefix are allowed.
 *            The raw S3 bucket URL is never exposed to the client.
 *
 * Caching:   5 min browser cache + 10 min stale-while-revalidate.
 *            Safe because every upload produces a new S3 key (timestamp-based).
 */
export async function GET(req: NextRequest) {
  // ── Validate key ─────────────────────────────────────────────────
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key parameter is required" }, { status: 400 });
  }

  // Only allow keys under the uploads/ prefix to prevent arbitrary S3 reads
  if (!key.startsWith("uploads/")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 403 });
  }

  // ── Fetch from S3 ────────────────────────────────────────────────
  const url = getPublicS3Url(key);
  const upstream = await fetch(url, { cache: "no-store" });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Image fetch failed" }, { status: upstream.status });
  }

  // 5 min browser cache, stale-while-revalidate for 10 more minutes.
  // Safe because a new upload = new S3 key = new URL (old cache irrelevant).
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}