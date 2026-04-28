import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { s3Service } from "@/lib/services/s3Service";
import {
  computePhotoSortDate,
  isMissingS3ObjectError,
  normalizePhotoCategory,
  normalizePhotoStatus,
  parsePhotoDate,
  trimNullableText,
} from "@/lib/photos";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const photoId = Number.parseInt(id, 10);
  if (!Number.isInteger(photoId)) {
    return NextResponse.json({ error: "Invalid photo id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const existing = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      exifTakenAt: true,
      manualTakenAt: true,
      uploadedAt: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const data: any = {};
  if ("caption" in body) data.caption = trimNullableText(body.caption, 500);
  if ("altText" in body) data.altText = trimNullableText(body.altText, 500);
  if ("category" in body) data.category = normalizePhotoCategory(body.category);
  if ("eventId" in body) {
    const eventId = typeof body.eventId === "string" && body.eventId ? body.eventId : null;
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 400 });
      }
    }
    data.eventId = eventId;
  }
  if ("status" in body) {
    const status = normalizePhotoStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }
  if ("manualTakenAt" in body) {
    data.manualTakenAt = parsePhotoDate(body.manualTakenAt);
  }

  if ("manualTakenAt" in data) {
    data.sortDate = computePhotoSortDate({
      exifTakenAt: existing.exifTakenAt,
      manualTakenAt: data.manualTakenAt,
      uploadedAt: existing.uploadedAt,
    });
  }

  const photo = await prisma.photo.update({
    where: { id: photoId },
    data,
    include: {
      event: {
        select: { id: true, title: true, date: true },
      },
    },
  });

  return NextResponse.json(photo);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await resolveAuthLevelFromRequest(request);
  if (!auth.isOfficer && !auth.isSeAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const photoId = Number.parseInt(id, 10);
  if (!Number.isInteger(photoId)) {
    return NextResponse.json({ error: "Invalid photo id" }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { id: true, originalKey: true, galleryKey: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  try {
    await Promise.all([
      deleteObjectUnlessMissing(photo.originalKey),
      deleteObjectUnlessMissing(photo.galleryKey),
    ]);
  } catch {
    return NextResponse.json(
      { error: "Failed to delete photo from S3" },
      { status: 502 }
    );
  }

  await prisma.photo.delete({ where: { id: photoId } });
  return NextResponse.json({ success: true });
}

async function deleteObjectUnlessMissing(key: string) {
  try {
    await s3Service.deleteObject(key);
  } catch (error) {
    if (!isMissingS3ObjectError(error)) {
      throw error;
    }
  }
}
