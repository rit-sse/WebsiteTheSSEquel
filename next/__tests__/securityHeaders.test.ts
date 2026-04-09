import { afterEach, describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  getSecurityHeaders,
} from "@/lib/securityHeaders";

const originalBucketName = process.env.AWS_S3_BUCKET_NAME;
const originalRegion = process.env.AWS_S3_REGION;

afterEach(() => {
  if (originalBucketName === undefined) {
    delete process.env.AWS_S3_BUCKET_NAME;
  } else {
    process.env.AWS_S3_BUCKET_NAME = originalBucketName;
  }

  if (originalRegion === undefined) {
    delete process.env.AWS_S3_REGION;
  } else {
    process.env.AWS_S3_REGION = originalRegion;
  }
});

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
    process.env.AWS_S3_BUCKET_NAME = "sse-web-prod";
    process.env.AWS_S3_REGION = "us-east-2";
    const policy = buildContentSecurityPolicy({ production: true });

    expect(policy).toContain("https://api.github.com");
    expect(policy).toContain("https://calendar.google.com");
    expect(policy).toContain("https://avatars.githubusercontent.com");
    expect(policy).toContain("https://*.googleusercontent.com");
    expect(policy).toContain("https://accounts.google.com");
    expect(policy).toContain("https://sse-web-prod.s3.us-east-2.amazonaws.com");
    expect(policy).toContain(
      "connect-src 'self' https://api.github.com https://*.s3.amazonaws.com https://*.amazonaws.com https://sse-web-prod.s3.us-east-2.amazonaws.com"
    );
  });

  it("adds a nonce to the script-src directive when provided", () => {
    const policy = buildContentSecurityPolicy({
      production: true,
      nonce: "test-nonce",
    });

    expect(policy).toContain("script-src 'self' 'nonce-test-nonce'");
    expect(policy).toContain("'strict-dynamic'");
  });

  it("can return only static security headers when CSP is injected elsewhere", () => {
    const headers = getSecurityHeaders({
      nodeEnv: "production",
      deploymentEnv: "prod",
      includeCsp: false,
    });
    const byKey = new Map(headers.map((header) => [header.key, header.value]));

    expect(byKey.get("Content-Security-Policy")).toBeUndefined();
    expect(byKey.get("Content-Security-Policy-Report-Only")).toBeUndefined();
    expect(byKey.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains"
    );
  });
});
