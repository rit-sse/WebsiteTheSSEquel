import { NextRequest, NextResponse } from "next/server";
import { getPublicS3Url } from "@/lib/s3Utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key parameter is required" }, { status: 400 });
  }

  const url = getPublicS3Url(key);
  const upstream = await fetch(url, { cache: "no-store" });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Image fetch failed" }, { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}