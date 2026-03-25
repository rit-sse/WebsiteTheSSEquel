import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import prisma from "@/lib/prisma";
import { normalizeToS3Key } from "@/lib/s3Utils";
import { s3Service } from "@/lib/services/s3Service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST - Generate a presigned upload URL for a library book cover image.
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

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { filename, contentType, isbn } = body;

    if (!filename || !contentType || !isbn) {
      return NextResponse.json(
        { error: "filename, contentType, and isbn are required" },
        { status: 400 }
      );
    }

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (!/^[\d-]+$/.test(isbn)) {
      return NextResponse.json(
        { error: "Invalid ISBN format" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `assets/library/${isbn}/${timestamp}-${sanitizedFilename}`;

    const uploadUrl = await s3Service.getSignedUploadUrl(key, contentType, 300);

    return NextResponse.json({ uploadUrl, key });
  } catch (error: any) {
    console.error("Error generating library book upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
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
