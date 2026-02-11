import { s3Service } from "@/lib/services/s3Service";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Get user from session
    const authToken = req.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized: no session token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        session: {
          some: {
            sessionToken: authToken,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: user not found" },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Failed to parse JSON", err);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { filename, contentType } = body;

    // Validate input
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    // Validate content type is an image
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Generate unique S3 key with user ID and timestamp
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/profile-pictures/${user.id}/${timestamp}-${sanitizedFilename}`;

    // Generate presigned upload URL (expires in 5 minutes)
    const uploadUrl = await s3Service.getSignedUploadUrl(
      key,
      contentType,
      300
    );

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