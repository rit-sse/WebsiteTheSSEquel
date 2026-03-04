import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveAuthLevelFromRequest,
  mockGetSessionToken,
  mockIsEmailConfigured,
  mockFindInvitations,
  mockUserFindFirst,
  mockInvitationCreate,
  mockInvitationDelete,
} = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
  mockGetSessionToken: vi.fn(),
  mockIsEmailConfigured: vi.fn(),
  mockFindInvitations: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockInvitationCreate: vi.fn(),
  mockInvitationDelete: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  isEmailConfigured: mockIsEmailConfigured,
}));

vi.mock("@/lib/baseUrl", () => ({
  getPublicBaseUrl: vi.fn(() => "https://example.com"),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    invitation: {
      findMany: mockFindInvitations,
      create: mockInvitationCreate,
      delete: mockInvitationDelete,
      findUnique: vi.fn(),
    },
    user: {
      findFirst: mockUserFindFirst,
      findUnique: vi.fn(),
    },
    officerPosition: {
      findUnique: vi.fn(),
    },
    officer: {
      findFirst: vi.fn(),
    },
    mentorApplication: {
      update: vi.fn(),
    },
  },
}));

import { DELETE, GET, POST } from "@/app/api/invitations/route";

describe("/api/invitations route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({ isOfficer: true });
    mockIsEmailConfigured.mockReturnValue(false);
  });

  it("GET denies non-officers", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({ isOfficer: false });
    const req = new Request("http://localhost/api/invitations") as any;
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("GET returns invitation list for officers", async () => {
    mockFindInvitations.mockResolvedValue([{ id: 1 }]);
    const req = new Request("http://localhost/api/invitations") as any;
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1 }]);
  });

  it("POST validates g.rit.edu email domain", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 5, email: "officer@g.rit.edu", name: "Officer" });
    const req = new Request("http://localhost/api/invitations", {
      method: "POST",
      body: JSON.stringify({ email: "x@example.com", type: "user" }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("DELETE requires numeric id", async () => {
    const req = new Request("http://localhost/api/invitations", {
      method: "DELETE",
      body: JSON.stringify({ id: "bad" }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});
