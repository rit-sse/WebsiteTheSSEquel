import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/gmail-callback
 * 
 * Handle the OAuth callback after a user grants gmail.send scope.
 * Exchanges the authorization code for tokens and updates the user's Account record.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  // Handle OAuth errors (e.g., user denied access)
  if (error) {
    console.error("Gmail scope authorization error:", error);
    const errorDescription = request.nextUrl.searchParams.get("error_description") || error;
    return NextResponse.redirect(
      new URL(`/dashboard?gmailAuthError=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL("/dashboard?gmailAuthError=Missing+authorization+code", request.url)
    );
  }

  // Decode state parameter
  let state: { returnUrl: string; userId: number };
  try {
    state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard?gmailAuthError=Invalid+state+parameter", request.url)
    );
  }

  // Verify the user is still logged in and matches the state
  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
  
  if (!authToken) {
    return NextResponse.redirect(
      new URL("/api/auth/signin?gmailAuthError=Session+expired", request.url)
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id: state.userId,
      session: {
        some: {
          sessionToken: authToken,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return NextResponse.redirect(
      new URL("/dashboard?gmailAuthError=Session+mismatch", request.url)
    );
  }

  // Build callback URL (must match what we used in the auth request)
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/api/auth/gmail-callback`;

  // Exchange authorization code for tokens
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL(`/dashboard?gmailAuthError=${encodeURIComponent("Failed to exchange token")}`, request.url)
      );
    }

    const tokens = await tokenResponse.json();
    
    // tokens contains: access_token, refresh_token, scope, expires_in, token_type
    console.log("Gmail scope authorization successful. Scopes granted:", tokens.scope);

    // Update the user's account with the new tokens and scope
    await prisma.account.updateMany({
      where: {
        userId: user.id,
        provider: "google",
      },
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined, // May not be returned if already granted
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        scope: tokens.scope, // This now includes gmail.send
      },
    });

    console.log(`Updated Gmail tokens for user ${user.id}`);

    // Redirect back to the original page with success message
    const redirectUrl = new URL(state.returnUrl, request.url);
    redirectUrl.searchParams.set("gmailAuthSuccess", "true");
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?gmailAuthError=Internal+error", request.url)
    );
  }
}
