import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSessionToken, mockFindUser, mockFindPurchase, mockSendEmail } = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockFindUser: vi.fn(),
  mockFindPurchase: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findFirst: mockFindUser },
    purchaseRequest: { findUnique: mockFindPurchase },
  },
}));

import { POST } from "@/app/api/purchasing/[id]/email/route";

function basePurchase() {
  return {
    id: 5,
    name: "User",
    committee: "Projects",
    description: "Buy something useful",
    estimatedCost: 25,
    createdAt: new Date("2026-03-03T12:00:00.000Z"),
    plannedDate: new Date("2026-03-10T12:00:00.000Z"),
    notifyEmail: "notify@example.com",
    receiptEmail: "receipt@example.com",
    user: { name: "Requester", email: "req@example.com" },
    eventName: null,
    eventDate: null,
    actualCost: null,
    attendanceData: null,
    receiptImage: null,
    attendanceImage: null,
  };
}

describe("/api/purchasing/[id]/email route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when type is missing", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindUser.mockResolvedValue({ id: 1, email: "x", name: "x" });
    mockFindPurchase.mockResolvedValue(basePurchase());

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as any, { params: Promise.resolve({ id: "5" }) });
    expect(res.status).toBe(400);
  });

  it("sends checkout email to required + notify recipients", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindUser.mockResolvedValue({ id: 1, email: "x", name: "x" });
    mockFindPurchase.mockResolvedValue(basePurchase());

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ type: "checkout" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as any, { params: Promise.resolve({ id: "5" }) });
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const payload = mockSendEmail.mock.calls[0][0];
    expect(payload.to).toContain("softwareengineering@rit.edu");
    expect(payload.to).toContain("notify@example.com");
  });

  it("includes receipt/attendance attachments for receipt emails", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindUser.mockResolvedValue({ id: 1, email: "x", name: "x" });
    mockFindPurchase.mockResolvedValue({
      ...basePurchase(),
      receiptImage: "data:image/png;base64,AAA",
      attendanceImage: "data:image/png;base64,BBB",
      eventName: "Event",
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ type: "receipt" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as any, { params: Promise.resolve({ id: "5" }) });
    expect(res.status).toBe(200);
    const payload = mockSendEmail.mock.calls[0][0];
    expect(payload.attachments).toHaveLength(2);
    expect(payload.attachments[0].content).toBe("AAA");
    expect(payload.attachments[1].content).toBe("BBB");
  });
});
