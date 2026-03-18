import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getRateLimitRule,
  rateLimitMiddleware,
  resetRateLimitBuckets,
  resolveClientIp,
} from "@/lib/middlewares/rateLimit";

function makeRequest(
  pathname: string,
  options: { method?: string; headers?: Record<string, string> } = {}
) {
  return {
    method: options.method ?? "GET",
    nextUrl: new URL(`http://localhost${pathname}`),
    headers: new Headers(options.headers ?? {}),
  } as any;
}

describe("rateLimitMiddleware", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    resetRateLimitBuckets();
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      vi.unstubAllEnvs();
      return;
    }

    vi.stubEnv("NODE_ENV", originalNodeEnv);
  });

  it("uses forwarded headers to resolve the client IP", () => {
    const ip = resolveClientIp(
      makeRequest("/api/quotes", {
        headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.1" },
      })
    );

    expect(ip).toBe("203.0.113.8");
  });

  it("recognizes configured routes only", () => {
    expect(
      getRateLimitRule(makeRequest("/api/quotes", { method: "POST" }))?.id
    ).toBe("quotes-post");
    expect(
      getRateLimitRule(makeRequest("/api/library/books", { method: "POST" }))
    ).toBeNull();
  });

  it("allows requests up to the threshold and then returns 429", async () => {
    const request = makeRequest("/api/quotes", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    for (let index = 0; index < 5; index++) {
      const response = await rateLimitMiddleware(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }

    const blocked = await rateLimitMiddleware(request);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("does not affect unrelated routes", async () => {
    const response = await rateLimitMiddleware(
      makeRequest("/api/library/search", { method: "GET" })
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
