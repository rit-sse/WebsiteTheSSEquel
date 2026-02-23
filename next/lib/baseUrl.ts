import { NextRequest } from "next/server";

/**
 * Resolve the public-facing base URL for the current deployment.
 *
 * Priority:
 *   1. NEXTAUTH_URL env var (explicitly set per environment)
 *   2. X-Forwarded-Host / X-Forwarded-Proto headers (reverse-proxy aware)
 *   3. request.nextUrl.origin (works for direct access / local dev)
 *   4. http://localhost:3000
 */
export function getPublicBaseUrl(request: NextRequest): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/+$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${forwardedHost}`;
  }

  const host = request.headers.get("host");
  if (host && !host.startsWith("0.0.0.0") && !host.startsWith("127.0.0.1")) {
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  const origin = request.nextUrl.origin;
  if (origin && !origin.includes("0.0.0.0")) {
    return origin;
  }

  return "http://localhost:3000";
}

/**
 * Resolve an internal API base URL for server-to-server calls (e.g. from middleware).
 * Prefers INTERNAL_API_URL when set, otherwise falls back to the request origin.
 */
export function getInternalApiBase(request: Request): string {
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL.replace(/\/+$/, "");
  }

  const origin =
    "nextUrl" in request
      ? (request as NextRequest).nextUrl.origin
      : new URL(request.url).origin;

  return origin;
}
