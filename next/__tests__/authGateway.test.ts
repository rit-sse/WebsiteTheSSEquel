import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockResolveAuthLevelFromRequest } = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

import { getGatewayAuthLevel } from "@/lib/authGateway";

describe("authGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges resolver data over defaults", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      userId: 7,
      isUser: true,
      isOfficer: true,
    });

    const auth = await getGatewayAuthLevel(new Request("http://localhost/api/test"));

    expect(auth).toMatchObject({
      userId: 7,
      isUser: true,
      isOfficer: true,
      isPrimary: false,
      membershipCount: 0,
    });
  });

  it("returns safe defaults when resolver throws", async () => {
    mockResolveAuthLevelFromRequest.mockRejectedValue(new Error("fail"));

    const auth = await getGatewayAuthLevel(new Request("http://localhost/api/test"));
    expect(auth).toEqual({
      userId: null,
      isUser: false,
      isMember: false,
      membershipCount: 0,
      isMentor: false,
      isOfficer: false,
      isMentoringHead: false,
      isProjectsHead: false,
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
    });
  });
});
