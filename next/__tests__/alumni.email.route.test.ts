import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockIsEmailConfigured,
  mockSendEmail,
  mockFindMany,
  mockCount,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockIsEmailConfigured: vi.fn(),
  mockSendEmail: vi.fn(),
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/email", () => ({
  isEmailConfigured: mockIsEmailConfigured,
  sendEmail: mockSendEmail,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    alumni: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

import { GET, POST } from "@/app/api/alumni/email/route";

describe("/api/alumni/email route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST requires primary auth", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isPrimary: false });
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ subject: "S", message: "M" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it("POST returns 503 when email is not configured", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isPrimary: true });
    mockIsEmailConfigured.mockReturnValue(false);
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ subject: "S", message: "M" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(503);
  });

  it("POST returns zero-sent summary when no opted-in alumni", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isPrimary: true });
    mockIsEmailConfigured.mockReturnValue(true);
    mockFindMany.mockResolvedValue([]);

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ subject: "S", message: "M" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, sent: 0 });
  });

  it("GET returns opted-in count for primary officer", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isPrimary: true });
    mockCount.mockResolvedValue(12);
    const res = await GET(new Request("http://localhost") as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ optedInCount: 12 });
  });
});
