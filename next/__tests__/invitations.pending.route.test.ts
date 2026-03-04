import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockUserFindFirst,
  mockInvitationFindMany,
  mockInvitationDeleteMany,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockInvitationFindMany: vi.fn(),
  mockInvitationDeleteMany: vi.fn(),
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
      findMany: mockInvitationFindMany,
      deleteMany: mockInvitationDeleteMany,
    },
  },
}));

import { GET } from "@/app/api/invitations/pending/route";

describe("/api/invitations/pending route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no logged-in user", async () => {
    mockGetSessionToken.mockReturnValue(null);

    const req = new Request("http://localhost/api/invitations/pending") as any;
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns pending invitations and cleans up expired ones", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 3, email: "member@g.rit.edu" });
    mockInvitationFindMany.mockResolvedValue([{ id: 7, invitedEmail: "member@g.rit.edu" }]);

    const req = new Request("http://localhost/api/invitations/pending") as any;
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 7, invitedEmail: "member@g.rit.edu" }]);
    expect(mockInvitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ invitedEmail: "member@g.rit.edu" }),
      })
    );
    expect(mockInvitationDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ invitedEmail: "member@g.rit.edu" }),
      })
    );
  });
});
