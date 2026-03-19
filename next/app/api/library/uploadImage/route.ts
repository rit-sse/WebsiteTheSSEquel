import { NextRequest } from "next/server";
import { getAuth } from "../authTools";
import { s3Service } from "@/lib/services/s3Service";
import prisma from "@/lib/prisma";
import { normalizeToS3Key } from "@/lib/s3Utils";

/**
 * POST - Upload a base64-encoded book cover image to S3.
 * Accepts { imageData, ISBN } where imageData is a base64 data URL.
 */
export async function POST(request: NextRequest) {
  console.log("POST /api/library/uploadImage");

  const auth = await getAuth(request);
  if (!auth.isOfficer && !auth.isMentor) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const { imageData, ISBN } = body;
  if (!imageData) {
    return new Response('"imageData" is required', { status: 400 });
  }

  if (!/^[\d-]+$/.test(ISBN)) {
    return new Response("Invalid ISBN Format", { status: 400 });
  }

  try {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const bytes = new Uint8Array(Buffer.from(base64Data, "base64"));

    const contentTypeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const contentType = contentTypeMatch ? contentTypeMatch[1] : "image/jpeg";
    const ext = contentType.split("/")[1] || "jpg";

    const timestamp = Date.now();
    const key = `uploads/library-books/${ISBN}/${timestamp}-cover.${ext}`;

    await s3Service.putObject(key, bytes, contentType);

    await prisma.textbooks.update({
      where: { ISBN },
      data: { imageKey: key },
    });

    return Response.json({ message: "Image uploaded successfully", key });
  } catch (e) {
    console.error("Error uploading image:", e);
    return new Response("Failed to upload image", { status: 500 });
  }
}

/**
 * PUT - Upload/replace a base64-encoded book cover image to S3.
 * Accepts { imageData, ISBN } where imageData is a base64 data URL.
 */
export async function PUT(request: NextRequest) {
  console.log("PUT /api/library/uploadImage");

  const auth = await getAuth(request);
  if (!auth.isOfficer && !auth.isMentor) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const { imageData, ISBN } = body;
  if (!imageData) {
    return new Response('"imageData" is required', { status: 400 });
  }
  if (!ISBN) {
    return new Response('"ISBN" is required for updating image', {
      status: 400,
    });
  }

  if (!/^[\d-]+$/.test(ISBN)) {
    return new Response("Invalid ISBN Format", { status: 400 });
  }

  try {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const bytes = new Uint8Array(Buffer.from(base64Data, "base64"));

    const contentTypeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const contentType = contentTypeMatch ? contentTypeMatch[1] : "image/jpeg";
    const ext = contentType.split("/")[1] || "jpg";

    const timestamp = Date.now();
    const key = `uploads/library-books/${ISBN}/${timestamp}-cover.${ext}`;

    await s3Service.putObject(key, bytes, contentType);

    // Delete old S3 image if different
    const existing = await prisma.textbooks.findUnique({
      where: { ISBN },
      select: { imageKey: true },
    });
    const oldKey = normalizeToS3Key(existing?.imageKey);
    if (oldKey && oldKey !== key) {
      try {
        await s3Service.deleteObject(oldKey);
      } catch (err) {
        console.error("Failed to delete old book image:", err);
      }
    }

    await prisma.textbooks.update({
      where: { ISBN },
      data: { imageKey: key },
    });

    const imageUrl = `/api/aws/image?key=${encodeURIComponent(key)}`;
    return Response.json({
      message: "Image uploaded successfully",
      imageUrl,
      key,
    });
  } catch (e) {
    console.error("Error uploading image:", e);
    return new Response("Failed to upload image", { status: 500 });
  }
}
