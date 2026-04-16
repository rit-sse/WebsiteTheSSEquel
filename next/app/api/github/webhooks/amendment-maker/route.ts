import crypto from "node:crypto";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function timingSafeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim();

  if (webhookSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!signature) {
      return new Response("Missing GitHub webhook signature", { status: 401 });
    }

    const expectedSignature = `sha256=${crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex")}`;

    if (!timingSafeEqualHex(signature, expectedSignature)) {
      return new Response("Invalid GitHub webhook signature", { status: 401 });
    }
  }

  return new Response(null, { status: 204 });
}
