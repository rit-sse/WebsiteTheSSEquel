import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  getSecurityHeaders,
} from "@/lib/securityHeaders";

describe("security headers", () => {
  it("returns report-only CSP without HSTS for local development", () => {
    const headers = getSecurityHeaders({
      nodeEnv: "development",
      deploymentEnv: "dev",
    });
    const byKey = new Map(headers.map((header) => [header.key, header.value]));

    expect(byKey.get("Content-Security-Policy-Report-Only")).toContain("ws:");
    expect(byKey.get("Content-Security-Policy")).toBeUndefined();
    expect(byKey.get("Strict-Transport-Security")).toBeUndefined();
  });

  it("returns report-only CSP without HSTS for deployed dev", () => {
    const headers = getSecurityHeaders({
      nodeEnv: "production",
      deploymentEnv: "dev",
    });
    const byKey = new Map(headers.map((header) => [header.key, header.value]));

    expect(byKey.get("Content-Security-Policy-Report-Only")).toContain(
      "frame-ancestors 'none'"
    );
    expect(byKey.get("Content-Security-Policy")).toBeUndefined();
    expect(byKey.get("Strict-Transport-Security")).toBeUndefined();
    expect(byKey.get("Content-Security-Policy-Report-Only")).not.toContain(
      "ws:"
    );
  });

  it("returns enforced CSP and HSTS in production", () => {
    const headers = getSecurityHeaders({
      nodeEnv: "production",
      deploymentEnv: "prod",
    });
    const byKey = new Map(headers.map((header) => [header.key, header.value]));

    expect(byKey.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'"
    );
    expect(byKey.get("Content-Security-Policy-Report-Only")).toBeUndefined();
    expect(byKey.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains"
    );
  });

  it("includes the expected production allowlist domains", () => {
    const policy = buildContentSecurityPolicy({ production: true });

    expect(policy).toContain("https://api.github.com");
    expect(policy).toContain("https://calendar.google.com");
    expect(policy).toContain("https://avatars.githubusercontent.com");
  });
});
