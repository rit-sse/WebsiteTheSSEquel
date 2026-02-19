import { NextRequest } from "next/server";
import { PROXY_EMAIL_HEADER, PROXY_GROUPS_HEADER } from "@/lib/proxyAuth";
import { AuthLevel } from "@/lib/authLevel";

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

function getCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    const [key, ...valueParts] = part.split("=");
    if (key === cookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }
  return null;
}

function getSessionTokenFromRequest(request: Request): string | null {
  const cookieName = process.env.SESSION_COOKIE_NAME;
  if (!cookieName) return null;

  if ("cookies" in request) {
    const nextRequest = request as NextRequest;
    return nextRequest.cookies.get(cookieName)?.value ?? null;
  }

  return getCookieValue(request.headers.get("cookie"), cookieName);
}

function resolveInternalApiBase(request: Request): string {
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL.replace(/\/$/, "");
  }

  if ("nextUrl" in request) {
    return (request as NextRequest).nextUrl.origin;
  }

  return new URL(request.url).origin;
}

function buildGatewayHeaders(request: Request): HeadersInit {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  const proxyEmail = request.headers.get(PROXY_EMAIL_HEADER);
  const proxyGroups = request.headers.get(PROXY_GROUPS_HEADER);

  if (proxyEmail) {
    headers[PROXY_EMAIL_HEADER] = proxyEmail;
  }
  if (proxyGroups) {
    headers[PROXY_GROUPS_HEADER] = proxyGroups;
  }

  return headers;
}

export async function getGatewayAuthLevel(request: Request): Promise<GatewayAuthLevel> {
  try {
    const token = getSessionTokenFromRequest(request);
    const baseUrl = resolveInternalApiBase(request);
    const response = await fetch(`${baseUrl}/api/authLevel`, {
      method: "PUT",
      headers: buildGatewayHeaders(request),
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ...DEFAULT_GATEWAY_AUTH_LEVEL };
    }

    const data = (await response.json()) as Partial<GatewayAuthLevel>;
    return {
      ...DEFAULT_GATEWAY_AUTH_LEVEL,
      ...data,
    };
  } catch {
    return { ...DEFAULT_GATEWAY_AUTH_LEVEL };
  }
}
