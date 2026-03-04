import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockGetServerSession,
  mockGetProxyEmail,
  mockUserFindFirst,
  mockSendEmail,
  mockIsEmailConfigured,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockGetServerSession: vi.fn(),
  mockGetProxyEmail: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockSendEmail: vi.fn(),
  mockIsEmailConfigured: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("next-auth/next", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/proxyAuth", () => ({
  getProxyEmail: mockGetProxyEmail,
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockUserFindFirst,
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
  isEmailConfigured: mockIsEmailConfigured,
}));

import { POST } from "@/app/api/swipe-access/route";

describe("/api/swipe-access route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: true });
    mockGetServerSession.mockResolvedValue({ user: { email: "officer@g.rit.edu" } });
    mockGetProxyEmail.mockReturnValue(null);
    mockUserFindFirst.mockResolvedValue({ id: 1, name: "Officer", email: "officer@g.rit.edu" });
    mockIsEmailConfigured.mockReturnValue(true);
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("returns 403 for non-officers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: false });

    const req = new Request("http://localhost/api/swipe-access", {
      method: "POST",
      body: JSON.stringify({ people: [{ name: "A", email: "a@g.rit.edu" }] }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 when people list is missing", async () => {
    const req = new Request("http://localhost/api/swipe-access", {
      method: "POST",
      body: JSON.stringify({ people: [] }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 when email is not configured", async () => {
    mockIsEmailConfigured.mockReturnValue(false);

    const req = new Request("http://localhost/api/swipe-access", {
      method: "POST",
      body: JSON.stringify({ people: [{ name: "A", email: "a@g.rit.edu" }] }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("sends swipe-access request email for valid payload", async () => {
    const req = new Request("http://localhost/api/swipe-access", {
      method: "POST",
      body: JSON.stringify({
        people: [
          { name: "Student One", email: "one@g.rit.edu" },
          { name: "Student Two", email: "two@g.rit.edu" },
        ],
        context: "Orientation",
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "softwareengineering@rit.edu",
        subject: expect.stringContaining("Orientation"),
      })
    );
  });
});
