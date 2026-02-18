import { NextRequest, NextResponse } from "next/server";
import { getPublicS3Url } from "@/lib/s3Utils";
import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";

export const dynamic = "force-dynamic";

/**
 * Authenticated image proxy for S3 profile pictures.
 *
 * Security:  Only logged-in users can fetch images (session cookie check).
 *            The S3 bucket URL is never exposed to the client.
 *
 * Caching:   Images are cached for 5 minutes with stale-while-revalidate
 *            for another 10 minutes.  This is safe because every upload
 *            produces a new S3 key (key contains a timestamp), so the URL
 *            changes on upload and the browser fetches fresh automatically.
 */
export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────
  const authToken = getSessionToken(req);
  if (!authToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken: authToken },
    select: { userId: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // ── Return with sensible cache headers ───────────────────────────
  // 5 min browser cache · stale-while-revalidate for 10 more minutes
  // Safe because a new upload = new S3 key = new URL (old cache irrelevant)
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}