import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { s3Service } from "@/lib/services/s3Service";
import { normalizeToS3Key } from "@/lib/s3Utils";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  detectImageMimeType,
  IMAGE_EXTENSIONS_BY_MIME,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
} from "@/lib/uploadValidation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(req);
  if (!auth.isPrimary) {
    return NextResponse.json(
      { error: "Primary officers only" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid upload payload" },
      { status: 400 }
    );
  }

  const rawUserId = formData.get("userId");
  const file = formData.get("file");
  const userId =
    typeof rawUserId === "string" ? Number.parseInt(rawUserId, 10) : NaN;

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Profile pictures must be 5MB or smaller" },
      { status: 413 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profileImageKey: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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

  const existingProfileImageKey = normalizeToS3Key(user.profileImageKey);
  if (existingProfileImageKey && existingProfileImageKey !== key) {
    try {
      await s3Service.deleteObject(existingProfileImageKey);
    } catch (err) {
      console.error("Failed to delete old profile picture:", err);
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { profileImageKey: key },
  });

  return NextResponse.json({ key }, { status: 201 });
}
