import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockFindFirst,
    },
  },
}));

vi.mock("@/lib/proxyAuth", () => ({
  hasStagingElevatedAccess: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: vi.fn(),
}));

import { resolveAuthLevelFromToken } from "@/lib/authLevelResolver";

describe("resolveAuthLevelFromToken with SE Admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("elevates a site admin across protected permissions", async () => {
    mockFindFirst.mockResolvedValue({
      id: 42,
      graduationTerm: "SPRING",
      graduationYear: 2027,
      major: "Software Engineering",
      gitHub: "https://github.com/example",
      linkedIn: "https://linkedin.com/in/example",
      mentor: [],
      officers: [
        {
          position: {
            title: "SE Admin",
            is_primary: false,
          },
        },
      ],
      _count: {
        Memberships: 3,
      },
    });

    const authLevel = await resolveAuthLevelFromToken("token", {
      includeProfileComplete: true,
      stagingElevated: false,
    });

    expect(authLevel.userId).toBe(42);
    expect(authLevel.isSeAdmin).toBe(true);
    expect(authLevel.isOfficer).toBe(true);
    expect(authLevel.isPrimary).toBe(true);
    expect(authLevel.isMentor).toBe(true);
    expect(authLevel.isTechCommitteeHead).toBe(true);
  });
});
