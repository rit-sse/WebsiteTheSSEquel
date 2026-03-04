import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockSendEmail,
  mockIsEmailConfigured,
  mockGetPublicBaseUrl,
  mockResolveUserImage,
  mockOfficerFindMany,
  mockOfficerDeleteMany,
  mockOfficerCreate,
  mockOfficerUpdate,
  mockOfficerFindUnique,
  mockOfficerDelete,
  mockUserFindFirst,
  mockOfficerPositionFindFirst,
  mockMembershipCreate,
  mockInvitationDeleteMany,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockSendEmail: vi.fn(),
  mockIsEmailConfigured: vi.fn(),
  mockGetPublicBaseUrl: vi.fn(),
  mockResolveUserImage: vi.fn(),
  mockOfficerFindMany: vi.fn(),
  mockOfficerDeleteMany: vi.fn(),
  mockOfficerCreate: vi.fn(),
  mockOfficerUpdate: vi.fn(),
  mockOfficerFindUnique: vi.fn(),
  mockOfficerDelete: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockOfficerPositionFindFirst: vi.fn(),
  mockMembershipCreate: vi.fn(),
  mockInvitationDeleteMany: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
  isEmailConfigured: mockIsEmailConfigured,
}));

vi.mock("@/lib/baseUrl", () => ({
  getPublicBaseUrl: mockGetPublicBaseUrl,
}));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    officer: {
      findMany: mockOfficerFindMany,
      deleteMany: mockOfficerDeleteMany,
      create: mockOfficerCreate,
      update: mockOfficerUpdate,
      findUnique: mockOfficerFindUnique,
      delete: mockOfficerDelete,
    },
    user: {
      findFirst: mockUserFindFirst,
    },
    officerPosition: {
      findFirst: mockOfficerPositionFindFirst,
    },
    memberships: {
      create: mockMembershipCreate,
    },
    invitation: {
      deleteMany: mockInvitationDeleteMany,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/officer/route";

describe("/api/officer route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
  });

  it("GET returns officers with resolved image field", async () => {
    mockOfficerFindMany.mockResolvedValue([
      {
        id: 1,
        is_active: true,
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        user: {
          id: 4,
          name: "Officer",
          email: "officer@example.com",
          profileImageKey: "img-key",
          googleImageURL: null,
        },
        position: { id: 2, is_primary: true, title: "President" },
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].user.image).toBe("resolved-image");
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/officer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_email: "x@example.com" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("POST returns 404 when user or position is missing", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValueOnce({ id: 90, email: "admin@example.com", name: "Admin" }); // logged-in user
    mockUserFindFirst.mockResolvedValueOnce(null); // target user not found
    mockOfficerPositionFindFirst.mockResolvedValue({ id: 1, title: "President" });

    const req = new Request("http://localhost/api/officer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_email: "missing@example.com",
        position: "President",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(404);
  });

  it("POST creates officer and sends assignment email when configured", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockIsEmailConfigured.mockReturnValue(true);
    mockGetPublicBaseUrl.mockReturnValue("https://example.com");

    mockUserFindFirst
      .mockResolvedValueOnce({ id: 90, email: "admin@example.com", name: "Admin" }) // logged-in user
      .mockResolvedValueOnce({ id: 10, email: "new@example.com", name: "New Officer" }); // target user
    mockOfficerPositionFindFirst.mockResolvedValue({ id: 3, title: "Mentoring Head" });
    mockOfficerCreate.mockResolvedValue({ id: 500 });

    const req = new Request("http://localhost/api/officer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_email: "new@example.com",
        position: "Mentoring Head",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockOfficerDeleteMany).toHaveBeenCalled();
    expect(mockMembershipCreate).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it("PUT returns 422 when id missing", async () => {
    const req = new Request("http://localhost/api/officer", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ start_date: "2026-01-01" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("DELETE returns 404 when officer not found", async () => {
    mockOfficerFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/officer", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: 7 }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });
});
