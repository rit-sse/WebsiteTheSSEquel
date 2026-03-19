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
      isUser: false,
      isOfficer: false,
      isMentor: false,
      isPrimary: false,
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

  it("allows auth level lookups without blocking anonymous users", async () => {
    const res = await authMiddleware(req("/api/authLevel", "GET"));
    expect((res as any).kind).toBe("next");
  });

  it("denies quote POST when user is not signed in", async () => {
    const res = await authMiddleware(req("/api/quotes", "POST"));
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain("need to be Signed-in User");
  });

  it("allows quote POST for signed-in non-officers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: false,
      isMentor: false,
      isPrimary: false,
    });

    const res = await authMiddleware(req("/api/quotes", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("allows alumni request submissions without officer auth", async () => {
    const res = await authMiddleware(req("/api/alumni-requests", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("denies alumni request updates without officer auth", async () => {
    const res = await authMiddleware(req("/api/alumni-requests", "PUT"));
    expect((res as any).status).toBe(403);
  });

  it("denies attendance mutation route-level path when user is not signed in", async () => {
    const res = await authMiddleware(req("/api/event/123/attendance", "POST"));
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain("need to be Signed-in User");
  });

  it("allows attendance mutation route-level path for signed-in users", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: false,
      isMentor: false,
      isPrimary: false,
    });

    const res = await authMiddleware(req("/api/event/123/attendance", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("denies non-attendance event mutation without officer", async () => {
    const res = await authMiddleware(req("/api/event/123", "POST"));
    expect((res as any).status).toBe(403);
  });

  it("allows public library catalog GET routes", async () => {
    const res = await authMiddleware(req("/api/library/books", "GET"));
    expect((res as any).kind).toBe("next");
  });

  it("denies protected library GET routes without mentor or officer access", async () => {
    const res = await authMiddleware(req("/api/library/isbnlookup", "GET"));
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain("need to be Mentor or Officer");
  });

  it("allows protected library GET routes for mentors", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: false,
      isMentor: true,
      isPrimary: false,
    });

    const res = await authMiddleware(req("/api/library/isbnlookup", "GET"));
    expect((res as any).kind).toBe("next");
  });

  it("allows library copy creation for signed-in users", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: false,
      isMentor: false,
      isPrimary: false,
    });

    const res = await authMiddleware(req("/api/library/copies", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("allows tech committee application GET routes without blocking anonymous users", async () => {
    const res = await authMiddleware(
      req("/api/tech-committee-application/apps", "GET")
    );
    expect((res as any).kind).toBe("next");
  });

  it("denies tech committee application mutations when user is not signed in", async () => {
    const res = await authMiddleware(
      req("/api/tech-committee-application", "PUT")
    );
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain("need to be Signed-in User");
  });

  it("allows tech committee application mutations for signed-in users", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: false,
      isMentor: false,
      isPrimary: false,
    });

    const res = await authMiddleware(
      req("/api/tech-committee-application", "POST")
    );
    expect((res as any).kind).toBe("next");
  });
});
