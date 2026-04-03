import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionCookieName, isGoogleAuthConfigured } from "@/lib/authConfig";

export const dynamic = "force-dynamic";

type DevLoginPayload = {
  email?: string;
  callbackUrl?: string;
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || isGoogleAuthConfigured()) {
    return NextResponse.json({ error: "Dev login is unavailable" }, { status: 403 });
  }

  let body: DevLoginPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const callbackUrl =
    body.callbackUrl && body.callbackUrl.startsWith("/") ? body.callbackUrl : "/";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "No user exists for that email" },
      { status: 404 }
    );
  }

  const sessionToken = crypto.randomUUID().replaceAll("-", "");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
    },
  });

  const cookieName = getSessionCookieName();
  const response = NextResponse.json({ ok: true, callbackUrl });

  response.cookies.set({
    name: cookieName,
    value: sessionToken,
    expires,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cookieName.startsWith("__Secure-"),
  });

  return response;
}
