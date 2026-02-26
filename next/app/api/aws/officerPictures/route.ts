/**
 * Officer-managed profile picture upload.
 *
 * Allows an active officer to generate a presigned S3 upload URL for any
 * user (identified by user ID) and then save the resulting key to that
 * user's profileImageKey.  Primarily used to add/update photos for legacy
 * imported users who have never signed in.
 */
import { s3Service } from "@/lib/services/s3Service";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { normalizeToS3Key } from "@/lib/s3Utils";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";

async function requireOfficer(req: NextRequest) {
  const auth = await resolveAuthLevelFromRequest(req);
  if (!auth.isOfficer) return null;
  return auth;
}

/** POST — generate a presigned upload URL for a user's photo */
export async function POST(req: NextRequest) {
  const auth = await requireOfficer(req);
  if (!auth) return NextResponse.json({ error: "Officers only" }, { status: 403 });

  let body: { userId: number; filename: string; contentType: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, filename, contentType } = body;
  if (!userId || !filename || !contentType) {
    return NextResponse.json({ error: "userId, filename, and contentType are required" }, { status: 400 });
  }
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `uploads/officer-managed/${userId}/${timestamp}-${sanitized}`;

  const uploadUrl = await s3Service.getSignedUploadUrl(key, contentType, 300);
  return NextResponse.json({ uploadUrl, key });
}

/** PUT — save an uploaded key to the user's profileImageKey */
export async function PUT(req: NextRequest) {
  const auth = await requireOfficer(req);
  if (!auth) return NextResponse.json({ error: "Officers only" }, { status: 403 });

  let body: { userId: number; key: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, key } = body;
  if (!userId || !key) {
    return NextResponse.json({ error: "userId and key are required" }, { status: 400 });
  }

  const prefix = `uploads/officer-managed/${userId}/`;
  if (!String(key).startsWith(prefix)) {
    return NextResponse.json({ error: "Invalid key prefix for this user" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profileImageKey: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Delete old officer-managed photo if present
  const existing = normalizeToS3Key(user.profileImageKey);
  if (existing && existing !== key && existing.startsWith("uploads/officer-managed/")) {
    try { await s3Service.deleteObject(existing); } catch {}
  }

  await prisma.user.update({ where: { id: userId }, data: { profileImageKey: key } });
  return NextResponse.json({ key });
}
