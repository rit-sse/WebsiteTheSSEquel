import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockUserFindFirst,
  mockIsEmailConfigured,
  mockSendEmail,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockIsEmailConfigured: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

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

import { POST } from "@/app/api/email/send/route";

describe("/api/email/send route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({
      id: 1,
      name: "Officer",
      email: "officer@g.rit.edu",
      officers: [{ position: { is_primary: true, title: "President" } }],
      mentor: [],
    });
    mockIsEmailConfigured.mockReturnValue(true);
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("returns 401 when session token is missing", async () => {
    mockGetSessionToken.mockReturnValue(null);

    const req = new Request("http://localhost/api/email/send", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 for authenticated non-officer/non-mentor", async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 2,
      name: "Member",
      email: "member@g.rit.edu",
      officers: [],
      mentor: [],
    });

    const req = new Request("http://localhost/api/email/send", {
      method: "POST",
      body: JSON.stringify({ subject: "A", message: "B", recipients: [{ email: "x@g.rit.edu" }] }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("validates recipients", async () => {
    const req = new Request("http://localhost/api/email/send", {
      method: "POST",
      body: JSON.stringify({ subject: "A", message: "B", recipients: [] }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns success summary when emails send", async () => {
    const req = new Request("http://localhost/api/email/send", {
      method: "POST",
      body: JSON.stringify({
        subject: "Hello",
        message: "**Test**",
        recipients: [{ email: "a@g.rit.edu" }, { email: "b@g.rit.edu" }],
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, sent: 2, failed: 0, total: 2 });
  });
});
