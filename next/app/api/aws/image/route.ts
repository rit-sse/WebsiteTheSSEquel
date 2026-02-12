import { NextRequest, NextResponse } from "next/server";
import { getPublicS3Url } from "@/lib/s3Utils";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "key parameter is required" },
      { status: 400 }
    );
  }

  const url = getPublicS3Url(key);
  return NextResponse.redirect(url);
}