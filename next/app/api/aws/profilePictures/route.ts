import { s3Service } from "@/lib/services/s3Service";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { normalizeToS3Key } from "@/lib/s3Utils";

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

export async function PUT(req: NextRequest) {
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
        session: {
          some: {
            sessionToken: authToken,
          },
        },
      },
      select: {
        id: true,
        profileImageKey: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: user not found" },
        { status: 401 }
      );
    }

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

    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "key is required" },
        { status: 400 }
      );
    }

    const requiredPrefix = `uploads/profile-pictures/${user.id}/`;
    if (!String(key).startsWith(requiredPrefix)) {
      return NextResponse.json(
        { error: "Invalid key prefix for current user" },
        { status: 403 }
      );
    }

    const existingProfileImageKey = normalizeToS3Key(user.profileImageKey);

    // Delete old profile picture from S3 if it exists and differs
    if (existingProfileImageKey && existingProfileImageKey !== key) {
      try {
        await s3Service.deleteObject(existingProfileImageKey);
      } catch (err) {
        console.error("Failed to delete old profile picture:", err);
      }
    }

    // Save the new key to the database and clear googleImageURL
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImageKey: key,
        googleImageURL: null,
      },
    });

    return NextResponse.json({
      message: "Profile picture saved successfully",
      key,
    });
  } catch (error: any) {
    console.error("Error saving profile picture key:", error);
    return NextResponse.json(
      { error: "Failed to save profile picture", details: error.message },
      { status: 500 }
    );
  }
}