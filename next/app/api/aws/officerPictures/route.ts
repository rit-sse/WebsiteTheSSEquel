import { s3Service } from "@/lib/services/s3Service";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function titleToSlug(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const authToken = req.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized: no session token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        session: { some: { sessionToken: authToken } },
        // optional: require active officer to update officer pictures
        officers: { some: { is_active: true } },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: officer access required" },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Failed to parse JSON", err);
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { title, titleKey, contentType } = body;

    if ((!title && !titleKey) || !contentType) {
      return NextResponse.json(
        { error: "title (or titleKey) and contentType are required" },
        { status: 400 }
      );
    }

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const normalizedTitleKey = titleKey
      ? titleToSlug(String(titleKey))
      : titleToSlug(String(title));

    // S3 key pattern for bucket layout
    const key = `assets/officers/${normalizedTitleKey}.jpg`;

    const uploadUrl = await s3Service.getSignedUploadUrl(key, contentType, 300);

    return NextResponse.json({
      uploadUrl,
      key,
      message: "Upload URL generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}

// This route is only for generating presigned upload URLs.
export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}