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

    static json(payload: unknown, init?: { status?: number }) {
      // Serialize so existing `.body.toContain(...)` assertions keep working
      // against the legacy plain-text substring checks.
      return new MockNextResponse(JSON.stringify(payload), init);
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

  it("allows public aws image proxy GET requests", async () => {
    const res = await authMiddleware(req("/api/aws/image", "GET"));
    expect((res as any).kind).toBe("next");
  });

  it("allows anonymous alumni-request picture uploads", async () => {
    const res = await authMiddleware(
      req("/api/aws/alumni-request-pictures", "POST")
    );
    expect((res as any).kind).toBe("next");
  });

  it("denies profile picture uploads when user is not signed in", async () => {
    const res = await authMiddleware(req("/api/aws/profilePictures", "POST"));
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain("need to be Signed-in User");
  });

  it("allows profile picture uploads for signed-in users", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: false,
      isMentor: false,
      isPrimary: false,
    });

    const res = await authMiddleware(req("/api/aws/profilePictures", "POST"));
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

  it("allows anonymous mentor headcount submissions", async () => {
    const res = await authMiddleware(req("/api/mentoring-headcount", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("allows anonymous mentee headcount submissions", async () => {
    const res = await authMiddleware(req("/api/mentee-headcount", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("keeps mentor headcount GET protected", async () => {
    const res = await authMiddleware(req("/api/mentoring-headcount", "GET"));
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain("need to be Officer");
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

  // ── Mentor schedule management routes ────────────────────────────────
  // These routes' handlers enforce `isMentoringHead || isPrimary`. The
  // middleware must match so that presidents / mentoring heads who have
  // no Mentor row (e.g. SSE club president) can still manage the schedule.

  it("allows scheduleBlock GET for anyone", async () => {
    const res = await authMiddleware(req("/api/scheduleBlock", "GET"));
    expect((res as any).kind).toBe("next");
  });

  it("denies scheduleBlock POST for a plain mentor without officer role", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: false,
      isMentor: true,
      isMentoringHead: false,
      isPrimary: false,
    });

    const res = await authMiddleware(req("/api/scheduleBlock", "POST"));
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain(
      "need to be Mentoring Head or Primary Officer"
    );
  });

  it("allows scheduleBlock POST for a primary officer with no Mentor row", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: true,
      isMentor: false,
      isMentoringHead: false,
      isPrimary: true,
    });

    const res = await authMiddleware(req("/api/scheduleBlock", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("allows scheduleBlock POST for the Mentoring Head", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isUser: true,
      isOfficer: true,
      isMentor: false,
      isMentoringHead: true,
      isPrimary: false,
    });

    const res = await authMiddleware(req("/api/scheduleBlock", "POST"));
    expect((res as any).kind).toBe("next");
  });

  it("denies mentorSchedule PUT for anonymous users", async () => {
    const res = await authMiddleware(req("/api/mentorSchedule", "PUT"));
    expect((res as any).status).toBe(403);
    expect((res as any).body).toContain(
      "need to be Mentoring Head or Primary Officer"
    );
  });

  it("returns access-denied as JSON so clients can safely response.json()", async () => {
    const res = await authMiddleware(req("/api/scheduleBlock", "POST"));
    expect((res as any).status).toBe(403);
    const parsed = JSON.parse((res as any).body);
    expect(parsed).toHaveProperty("error");
    expect(parsed.error).toContain(
      "need to be Mentoring Head or Primary Officer"
    );
  });
});
