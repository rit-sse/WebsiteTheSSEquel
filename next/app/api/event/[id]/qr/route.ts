import { getPayloadClient } from "@/lib/payload";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

/**
 * HTTP GET request to /api/event/[id]/qr
 * @returns QR code PNG image pointing to the attendance page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    const payload = await getPayloadClient();
    const event = (await payload.findByID({
      collection: "events",
      id: eventId,
    })) as Record<string, any> | null;

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (!Boolean(event.attendanceEnabled)) {
      return NextResponse.json(
        { error: "Attendance tracking is not enabled for this event" },
        { status: 400 }
      );
    }

    // Get the base URL from the request or use environment variable
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const attendanceUrl = `${protocol}://${host}/events/${eventId}/attend`;

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
