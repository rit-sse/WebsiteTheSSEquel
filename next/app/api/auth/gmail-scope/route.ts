import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { GMAIL_SEND_SCOPE } from "@/lib/email/checkGmailScope";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/gmail-scope
 * 
 * Generate a Google OAuth URL for incremental authorization to add gmail.send scope.
 * This endpoint is used when an officer needs to send email but hasn't granted the scope yet.
 * 
 * Query params:
 *   - returnUrl: URL to redirect back to after authorization (optional, defaults to /dashboard)
 * 
 * Returns:
 *   - { authUrl: string } - The Google OAuth URL to redirect to
 */
export async function GET(request: NextRequest) {
  // Get the logged-in user's session token
  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
  
  if (!authToken) {
    return Response.json(
      { error: "Not authenticated" }, 
      { status: 401 }
    );
  }

  // Find the logged-in user
  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken: authToken,
        },
      },
    },
    select: {
      id: true,
      email: true,
      officers: {
        where: { is_active: true },
        select: { id: true },
      },
    },
  });

  if (!user) {
    return Response.json(
      { error: "User not found" }, 
      { status: 401 }
    );
  }

  // Verify user is an officer
  if (user.officers.length === 0) {
    return Response.json(
      { error: "Only officers can request Gmail send permissions" }, 
      { status: 403 }
    );
  }

  // Get return URL from query params
  const returnUrl = request.nextUrl.searchParams.get("returnUrl") || "/dashboard";
  
  // Create state parameter with return URL and user ID (for verification in callback)
  const state = Buffer.from(
    JSON.stringify({ returnUrl, userId: user.id })
  ).toString("base64url");

  // Build the callback URL
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/api/auth/gmail-callback`;

  // Build Google OAuth URL for incremental authorization
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: GMAIL_SEND_SCOPE,
    // Include previously granted scopes - this is key for incremental auth
    include_granted_scopes: "true",
    // Request offline access to get a refresh token
    access_type: "offline",
    // Force consent screen to ensure we get a refresh token
    prompt: "consent",
    state,
    // Pre-fill the email address
    login_hint: user.email,
    // Restrict to RIT domain
    hd: "g.rit.edu",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return Response.json({ authUrl });
}
