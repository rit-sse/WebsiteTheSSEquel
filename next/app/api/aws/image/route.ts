import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, getBucketName } from "@/lib/S3Client";

export const dynamic = "force-dynamic";

/**
 * Image proxy for S3 uploads (profile pictures, library book covers, etc.).
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
    return NextResponse.json(
      { error: "key parameter is required" },
      { status: 400 }
    );
  }

  // Only allow keys under the uploads/ prefix to prevent arbitrary S3 reads
  if (!key.startsWith("uploads/")) {
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
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    if (err.name === "NoSuchKey") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    console.error("S3 image fetch error:", err);
    return NextResponse.json({ error: "Image fetch failed" }, { status: 500 });
  }
}
