import prisma from "@/lib/prisma";
import { GMAIL_SEND_SCOPE } from "./checkGmailScope";

export type AccessTokenResult = 
  | { success: true; accessToken: string }
  | { success: false; error: "no_account" | "no_scope" | "no_refresh_token" | "refresh_failed" };

/**
 * Get a valid access token for a user, refreshing if necessary.
 * Returns detailed result including whether the user has the required scope.
 * 
 * Access tokens expire after ~1 hour, so we need to use the refresh_token
 * to get a new one when the stored token is expired or about to expire.
 */
export async function getValidAccessTokenWithDetails(userId: number): Promise<AccessTokenResult> {
  // Get the user's Google account
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
      scope: true,
    },
  });

  if (!account) {
    console.error(`No Google account found for user ${userId}`);
    return { success: false, error: "no_account" };
  }

  // Check if user has the gmail.send scope
  if (!account.scope?.includes(GMAIL_SEND_SCOPE)) {
    console.log(`User ${userId} does not have gmail.send scope. Current scopes: ${account.scope}`);
    return { success: false, error: "no_scope" };
  }

  if (!account.refresh_token) {
    console.error(`No refresh token found for user ${userId}. User needs to re-authorize.`);
    return { success: false, error: "no_refresh_token" };
  }

  // Check if access token is still valid (with 5 minute buffer)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at || 0;
  const isExpired = expiresAt < now + 300; // 5 minute buffer

  if (!isExpired && account.access_token) {
    console.log(`Using existing access token for user ${userId} (expires in ${expiresAt - now}s)`);
    return { success: true, accessToken: account.access_token };
  }

  // Token is expired or about to expire, refresh it
  console.log(`Refreshing access token for user ${userId}...`);

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to refresh token: ${response.status} - ${error}`);
      return { success: false, error: "refresh_failed" };
    }

    const data = await response.json();

    // Update the account with the new access token
    await prisma.account.updateMany({
      where: {
        userId,
        provider: "google",
      },
      data: {
        access_token: data.access_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      },
    });

    console.log(`Successfully refreshed access token for user ${userId}`);
    return { success: true, accessToken: data.access_token };
  } catch (error) {
    console.error(`Error refreshing token for user ${userId}:`, error);
    return { success: false, error: "refresh_failed" };
  }
}

/**
 * Get a valid access token for a user, refreshing if necessary
 * 
 * @deprecated Use getValidAccessTokenWithDetails for better error handling
 * 
 * Access tokens expire after ~1 hour, so we need to use the refresh_token
 * to get a new one when the stored token is expired or about to expire.
 */
export async function getValidAccessToken(userId: number): Promise<string | null> {
  // Get the user's Google account
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!account) {
    console.error(`No Google account found for user ${userId}`);
    return null;
  }

  if (!account.refresh_token) {
    console.error(`No refresh token found for user ${userId}. User needs to re-login with consent.`);
    return null;
  }

  // Check if access token is still valid (with 5 minute buffer)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at || 0;
  const isExpired = expiresAt < now + 300; // 5 minute buffer

  if (!isExpired && account.access_token) {
    console.log(`Using existing access token for user ${userId} (expires in ${expiresAt - now}s)`);
    return account.access_token;
  }

  // Token is expired or about to expire, refresh it
  console.log(`Refreshing access token for user ${userId}...`);

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to refresh token: ${response.status} - ${error}`);
      return null;
    }

    const data = await response.json();

    // Update the account with the new access token
    await prisma.account.updateMany({
      where: {
        userId,
        provider: "google",
      },
      data: {
        access_token: data.access_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      },
    });

    console.log(`Successfully refreshed access token for user ${userId}`);
    return data.access_token;
  } catch (error) {
    console.error(`Error refreshing token for user ${userId}:`, error);
    return null;
  }
}
