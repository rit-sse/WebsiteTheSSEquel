import { NextRequest } from "next/server";
import { AuthLevel } from "@/lib/authLevel";
import { getSessionToken } from "@/lib/sessionToken";

export type GatewayAuthLevel = AuthLevel;

const DEFAULT_GATEWAY_AUTH_LEVEL: GatewayAuthLevel = {
  userId: null,
  isUser: false,
  isMember: false,
  membershipCount: 0,
  isMentor: false,
  isOfficer: false,
  isMentoringHead: false,
  isProjectsHead: false,
  isPrimary: false,
};

function getSessionTokenFromRequest(request: Request): string | null {
  if ("cookies" in request) {
    return getSessionToken(request as NextRequest) ?? null;
  }
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const cookieMap = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    cookieMap.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }
  for (const name of [
    process.env.SESSION_COOKIE_NAME,
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ].filter((n): n is string => !!n)) {
    const value = cookieMap.get(name);
    if (value) return value;
  }
  return null;
}

export async function getGatewayAuthLevel(request: Request): Promise<GatewayAuthLevel> {
  // Try direct Prisma first (works when node_modules are available).
  try {
    const { resolveAuthLevelFromRequest } = await import("@/lib/authLevelResolver");
    const data = await resolveAuthLevelFromRequest(request);
    return { ...DEFAULT_GATEWAY_AUTH_LEVEL, ...data };
  } catch {
    // Prisma unavailable (Docker standalone middleware bundle).
    // Fall back to internal HTTP call to the authLevel API route.
  }

  try {
    const token = getSessionTokenFromRequest(request);
    const port = process.env.PORT || "3000";
    const baseUrl = process.env.INTERNAL_API_URL || `http://localhost:${port}`;
    const response = await fetch(`${baseUrl}/api/authLevel`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    if (!response.ok) return { ...DEFAULT_GATEWAY_AUTH_LEVEL };
    const data = (await response.json()) as Partial<GatewayAuthLevel>;
    return { ...DEFAULT_GATEWAY_AUTH_LEVEL, ...data };
  } catch {
    return { ...DEFAULT_GATEWAY_AUTH_LEVEL };
  }
}
