import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "./lib/middlewares/rateLimit";
import { golinksMiddleware } from "./lib/middlewares/golinks";
import { authMiddleware } from "./lib/middlewares/authentication";
import { buildContentSecurityPolicy } from "./lib/securityHeaders";

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function applyCsp(response: NextResponse, nonce: string) {
  const cspHeaderName =
    process.env.NEXT_PUBLIC_ENV === "prod"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";
  const cspValue = buildContentSecurityPolicy({
    production: process.env.NODE_ENV === "production",
    nonce,
  });

  response.headers.set(cspHeaderName, cspValue);
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let response = await rateLimitMiddleware(request);
  if (response.headers.get("x-middleware-next") != "1") {
    return applyCsp(response, nonce);
  }

  response = await authMiddleware(request);
  if (response.headers.get("x-middleware-next") != "1") {
    return applyCsp(response, nonce);
  }

  response = await golinksMiddleware(request);
  if (response.headers.get("x-middleware-next") != "1") {
    return applyCsp(response, nonce);
  }

  return applyCsp(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    nonce
  );
}
