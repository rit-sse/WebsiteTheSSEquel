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

  it("elevates any active SE Office position holder across protected permissions", async () => {
    // `isSeAdmin` is now category-based (SE_OFFICE includes
    // Administrative Assistant / Dean / SE Office Head /
    // Undergraduate Dean) rather than keyed off the literal
    // `title = "SE Admin"`. Use a real SE Office position so the
    // mock matches what production data would look like.
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
            title: "Dean",
            is_primary: false,
            category: "SE_OFFICE",
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

  it("does NOT elevate a non-SE-Office officer (regression guard for the broader category check)", async () => {
    mockFindFirst.mockResolvedValue({
      id: 7,
      graduationTerm: "FALL",
      graduationYear: 2026,
      major: "CS",
      gitHub: null,
      linkedIn: null,
      mentor: [],
      officers: [
        {
          position: {
            title: "Lab Division Manager",
            is_primary: false,
            category: "PRIMARY_OFFICER",
          },
        },
      ],
      _count: { Memberships: 1 },
    });

    const authLevel = await resolveAuthLevelFromToken("token", {
      stagingElevated: false,
    });

    expect(authLevel.userId).toBe(7);
    // Lab Division Manager is a committee position, not SE Office —
    // they should NOT pick up SE-Admin-tier privileges.
    expect(authLevel.isSeAdmin).toBe(false);
  });
});
