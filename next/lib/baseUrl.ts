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
 * Resolve an internal API base URL for server-to-server calls (e.g. from
 * middleware calling its own API routes).  These calls must always use plain
 * HTTP to localhost — never the external hostname or HTTPS — because:
 *   • The app server has no TLS (HTTPS would fail with ERR_SSL_WRONG_VERSION_NUMBER).
 *   • 0.0.0.0 is a bind address, not a connectable one.
 *   • Going through the external hostname adds a needless proxy round-trip.
 */
export function getInternalApiBase(request: Request): string {
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL.replace(/\/+$/, "");
  }

  const port = process.env.PORT || "3000";

  const origin =
    "nextUrl" in request
      ? (request as NextRequest).nextUrl.origin
      : new URL(request.url).origin;

  // If the origin already points to a plain-HTTP localhost, use it as-is.
  if (
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1")
  ) {
    return origin;
  }

  // Everything else (0.0.0.0, external hostname, https, etc.) → localhost.
  return `http://localhost:${port}`;
}
