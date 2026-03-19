import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import prisma from "@/lib/prisma";
import { normalizeToS3Key } from "@/lib/s3Utils";
import { s3Service } from "@/lib/services/s3Service";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  detectImageMimeType,
  IMAGE_EXTENSIONS_BY_MIME,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
} from "@/lib/uploadValidation";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST - Upload a library book cover image to S3 and return its key.
 * Requires mentor or officer auth.
 */
export async function POST(req: NextRequest) {
  try {
    const authLevel = await resolveAuthLevelFromRequest(req, {
      includeProfileComplete: true,
    });
    if (!authLevel.isOfficer && !authLevel.isMentor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid upload payload" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const isbn = String(formData.get("isbn") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!isbn) {
      return NextResponse.json(
        { error: "isbn is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Book cover images must be 5MB or smaller" },
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

    if (!/^[\d-]+$/.test(isbn)) {
      return NextResponse.json(
        { error: "Invalid ISBN format" },
        { status: 400 }
      );
    }

    const extension = IMAGE_EXTENSIONS_BY_MIME[detectedMimeType];
    const baseName = (file.name.replace(/\.[^.]+$/, "") || "cover").replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    );
    const key = `uploads/library-books/${isbn}/${Date.now()}-${baseName}-${randomUUID()}.${extension}`;

    await s3Service.putObject(key, bytes, detectedMimeType);

    return NextResponse.json(
      { key, message: "Library book cover uploaded successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error uploading library book cover:", error);
    return NextResponse.json(
      { error: "Failed to upload library book cover", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Save an S3 image key to a textbook record.
 * Deletes the old S3 image if one existed.
 */
export async function PUT(req: NextRequest) {
  try {
    const authLevel = await resolveAuthLevelFromRequest(req, {
      includeProfileComplete: true,
    });
    if (!authLevel.isOfficer && !authLevel.isMentor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { key, isbn } = body;

    if (!key || !isbn) {
      return NextResponse.json(
        { error: "key and isbn are required" },
        { status: 400 }
      );
    }

    if (!String(key).startsWith("uploads/library-books/")) {
      return NextResponse.json(
        { error: "Invalid key prefix" },
        { status: 403 }
      );
    }

    const book = await prisma.textbooks.findUnique({
      where: { ISBN: isbn },
      select: { imageKey: true },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Delete old S3 image if it exists and differs
    const existingKey = normalizeToS3Key(book.imageKey);
    if (existingKey && existingKey !== key) {
      try {
        await s3Service.deleteObject(existingKey);
      } catch (err) {
        console.error("Failed to delete old book image:", err);
      }
    }

    await prisma.textbooks.update({
      where: { ISBN: isbn },
      data: { imageKey: key },
    });

    return NextResponse.json({ message: "Book image saved", key });
  } catch (error: any) {
    console.error("Error saving library book image key:", error);
    return NextResponse.json(
      { error: "Failed to save book image", details: error.message },
      { status: 500 }
    );
  }
}
