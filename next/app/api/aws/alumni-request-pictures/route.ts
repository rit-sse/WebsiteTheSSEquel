import { randomUUID } from "node:crypto";
import { s3Service } from "@/lib/services/s3Service";
import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  detectImageMimeType,
  IMAGE_EXTENSIONS_BY_MIME,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
} from "@/lib/uploadValidation";

/**
 * Anonymous photo upload for the public "Request to be added as
 * alumni" form. Unlike `/api/aws/profilePictures` this does NOT
 * require a session — alumni who haven't created an account yet
 * (most of them) need to be able to attach a photo when submitting
 * the request, and the SE Office reviews every request before any
 * Alumni record gets created so an unauthenticated upload is
 * acceptable here.
 *
 * Same MIME-type / size validation as the authenticated endpoint;
 * uploads land in a distinct `uploads/alumni-requests/` prefix so
 * the SE Office can audit them separately and prune anything
 * orphaned from a rejected request.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
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
    // No userId scope on this prefix — uploads are anonymous. Random
    // UUID + timestamp is enough to dodge collisions and lets us
    // identify orphaned uploads later by directory listing.
    const key = `uploads/alumni-requests/${Date.now()}-${randomUUID()}.${extension}`;

    await s3Service.putObject(key, bytes, detectedMimeType);

    return NextResponse.json(
      {
        key,
        message: "Alumni-request photo uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error uploading alumni-request photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo", details: error.message },
      { status: 500 }
    );
  }
}
