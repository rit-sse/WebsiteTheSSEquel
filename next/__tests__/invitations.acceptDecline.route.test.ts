import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockUserFindFirst,
  mockInvitationFindUnique,
  mockInvitationDelete,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockInvitationFindUnique: vi.fn(),
  mockInvitationDelete: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockUserFindFirst,
    },
    invitation: {
      findUnique: mockInvitationFindUnique,
      delete: mockInvitationDelete,
    },
    officer: {
      findFirst: vi.fn(),
    },
    memberships: {
      create: vi.fn(),
    },
    mentor: {
      findFirst: vi.fn(),
    },
    mentorApplication: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { POST as acceptPOST } from "@/app/api/invitations/accept/route";
import { POST as declinePOST } from "@/app/api/invitations/decline/route";

describe("/api/invitations/accept route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated users", async () => {
    mockGetSessionToken.mockReturnValue(null);

    const req = new Request("http://localhost/api/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ invitationId: 1 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await acceptPOST(req);
    expect(res.status).toBe(401);
  });

  it("requires invitationId", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 1, email: "user@g.rit.edu", name: "User" });

    const req = new Request("http://localhost/api/invitations/accept", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await acceptPOST(req);
    expect(res.status).toBe(400);
  });

  it("returns 410 and deletes expired invitations", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 1, email: "user@g.rit.edu", name: "User" });
    mockInvitationFindUnique.mockResolvedValue({
      id: 8,
      type: "user",
      invitedEmail: "user@g.rit.edu",
      expiresAt: new Date(Date.now() - 60_000),
    });

    const req = new Request("http://localhost/api/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ invitationId: 8 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await acceptPOST(req);
    expect(res.status).toBe(410);
    expect(mockInvitationDelete).toHaveBeenCalledWith({ where: { id: 8 } });
  });
});

describe("/api/invitations/decline route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 1, email: "user@g.rit.edu" });
  });

  it("returns 404 when invitation does not exist", async () => {
    mockInvitationFindUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/invitations/decline", {
      method: "POST",
      body: JSON.stringify({ invitationId: 99 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await declinePOST(req);
    expect(res.status).toBe(404);
  });

  it("returns 403 when invitation email does not match", async () => {
    mockInvitationFindUnique.mockResolvedValue({
      id: 2,
      type: "user",
      invitedEmail: "different@g.rit.edu",
    });

    const req = new Request("http://localhost/api/invitations/decline", {
      method: "POST",
      body: JSON.stringify({ invitationId: 2 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await declinePOST(req);
    expect(res.status).toBe(403);
  });

  it("deletes invitation when decline is valid", async () => {
    mockInvitationFindUnique.mockResolvedValue({
      id: 3,
      type: "officer",
      invitedEmail: "user@g.rit.edu",
    });

    const req = new Request("http://localhost/api/invitations/decline", {
      method: "POST",
      body: JSON.stringify({ invitationId: 3 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await declinePOST(req);
    expect(res.status).toBe(200);
    expect(mockInvitationDelete).toHaveBeenCalledWith({ where: { id: 3 } });

    const body = await res.json();
    expect(body).toMatchObject({ success: true });
  });
});
