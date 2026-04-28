import { randomUUID } from "node:crypto";
import { s3Service } from "@/lib/services/s3Service";
import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest, NextResponse } from "next/server";
import { normalizeToS3Key } from "@/lib/s3Utils";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  detectImageMimeType,
  IMAGE_EXTENSIONS_BY_MIME,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
} from "@/lib/uploadValidation";

export async function POST(req: NextRequest) {
  try {
    // Get user from session
    const authToken = getSessionToken(req);

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

    let formData;
    try {
      formData = await req.formData();
    } catch (err) {
      console.error("Failed to parse multipart form data", err);
      return NextResponse.json(
        { error: "Invalid upload payload" },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Profile pictures must be 5MB or smaller" },
        { status: 413 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detectedMimeType = detectImageMimeType(bytes);

    if (file.type === "image/svg+xml" || detectedMimeType === "image/svg+xml") {
      return NextResponse.json(
        { error: "SVG uploads are not allowed" },
        { status: 415 }
      );
    }

    if (!detectedMimeType || !ALLOWED_IMAGE_MIME_TYPES.has(detectedMimeType)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WEBP, and GIF images are allowed" },
        { status: 415 }
      );
    }

    if (!file.type || file.type !== detectedMimeType) {
      return NextResponse.json(
        { error: "Uploaded file type does not match file contents" },
        { status: 415 }
      );
    }

    const extension = IMAGE_EXTENSIONS_BY_MIME[detectedMimeType];
    const key = `uploads/profile-pictures/${user.id}/${Date.now()}-${randomUUID()}.${extension}`;

    await s3Service.putObject(key, bytes, detectedMimeType);

    return NextResponse.json(
      {
        key,
        message: "Profile picture uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Failed to upload profile picture", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authToken = getSessionToken(req);

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
      return NextResponse.json({ error: "key is required" }, { status: 400 });
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

    // Save the new key; keep googleImageURL as a fallback if S3 ever fails.
    // resolveUserImage() already prefers profileImageKey over googleImageURL.
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImageKey: key },
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
