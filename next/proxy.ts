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

const CMS_REWRITE_RESERVED_SEGMENTS = new Set([
  "api",
  "_next",
  "__cms",
  "cms-render",
  "dashboard",
  "auth",
  "profile",
  "settings",
  "print",
  "go",
  "library",
]);

function shouldProbeCmsPage(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const pathname = request.nextUrl.pathname;
  if (pathname === "/" || pathname.startsWith("//")) return false;

  const slug = pathname.replace(/^\/+|\/+$/g, "");
  if (!slug) return false;
  const firstSegment = slug.split("/")[0] ?? "";
  if (CMS_REWRITE_RESERVED_SEGMENTS.has(firstSegment)) return false;

  const lastSegment = slug.split("/").at(-1) ?? "";
  if (lastSegment.includes(".")) return false;

  return true;
}

async function maybeRewriteCmsPage(
  request: NextRequest,
  requestHeaders: Headers
) {
  if (!shouldProbeCmsPage(request)) return null;

  const slug = request.nextUrl.pathname.replace(/^\/+|\/+$/g, "");
  const probeUrl = new URL(`/api/pages/by-slug/${slug}`, request.url);
  const preview = request.nextUrl.searchParams.get("preview");
  if (preview) probeUrl.searchParams.set("preview", preview);

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const probe = await fetch(probeUrl, {
    headers,
    cache: "no-store",
  }).catch(() => null);

  if (!probe?.ok) return null;

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/cms-render/${slug}`;
  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
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

  const cmsRewrite = await maybeRewriteCmsPage(request, requestHeaders);
  if (cmsRewrite) {
    return applyCsp(cmsRewrite, nonce);
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
