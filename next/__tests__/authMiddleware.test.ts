import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetGatewayAuthLevel } = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("next/server", () => {
  class MockNextResponse {
    body: string;
    status: number;

    constructor(body: string, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
    }

    static next() {
      return { kind: "next" };
    }
  }

  return {
    NextResponse: MockNextResponse,
  };
});

import { authMiddleware } from "@/lib/middlewares/authentication";

function req(pathname: string, method = "GET") {
  return {
    method,
    nextUrl: { pathname },
  } as any;
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({
      isOfficer: false,
      isMentor: false,
    });
  });

  it("allows non-api routes", async () => {
    const res = await authMiddleware(req("/about", "GET"));
    expect((res as any).kind).toBe("next");
  });

  it("allows unknown api routes", async () => {
    const res = await authMiddleware(req("/api/unknown", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("allows public GET on nonGetOfficer route", async () => {
    const res = await authMiddleware(req("/api/quotes", "GET"));
    expect((res as any).kind).toBe("next");
  });

  it("denies protected POST when user is not officer", async () => {
    const res = await authMiddleware(req("/api/quotes", "POST"));
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain("need to be Officer");
  });

  it("allows alumni request submissions without officer auth", async () => {
    const res = await authMiddleware(req("/api/alumni-requests", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("denies alumni request updates without officer auth", async () => {
    const res = await authMiddleware(req("/api/alumni-requests", "PUT"));
    expect((res as any).status).toBe(403);
  });

  it("allows attendance mutation route-level path without officer", async () => {
    const res = await authMiddleware(req("/api/event/123/attendance", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("denies non-attendance event mutation without officer", async () => {
    const res = await authMiddleware(req("/api/event/123", "POST"));
    expect((res as any).status).toBe(403);
  });
});
