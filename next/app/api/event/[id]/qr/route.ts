import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

/**
 * HTTP GET request to /api/event/[id]/qr
 * @returns QR code PNG image pointing to the attendance page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: eventId } = params;

  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        attendanceEnabled: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (!event.attendanceEnabled) {
      return NextResponse.json(
        { error: "Attendance tracking is not enabled for this event" },
        { status: 400 }
      );
    }

    const baseUrl =
      request.nextUrl.origin ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      "http://localhost:3000";
    const attendanceUrl = `${baseUrl}/events/${eventId}/attend`;

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(attendanceUrl, {
      type: "png",
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    const body = new Uint8Array(qrCodeBuffer);

    // Return the QR code image
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="qr-${eventId}.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
