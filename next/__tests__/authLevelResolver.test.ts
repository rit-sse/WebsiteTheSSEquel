import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindFirst, mockHasStagingElevatedAccess, mockGetSessionToken } =
  vi.hoisted(() => ({
    mockFindFirst: vi.fn(),
    mockHasStagingElevatedAccess: vi.fn(),
    mockGetSessionToken: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockFindFirst,
    },
  },
}));

vi.mock("@/lib/proxyAuth", () => ({
  hasStagingElevatedAccess: mockHasStagingElevatedAccess,
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

import {
  getSessionTokenFromRequest,
  resolveAuthLevelFromRequest,
  resolveAuthLevelFromToken,
} from "@/lib/authLevelResolver";

describe("authLevelResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_COOKIE_NAME = "custom-token";
  });

  it("extracts session token from cookie header fallback", () => {
    const req = new Request("http://localhost/api/authLevel", {
      headers: {
        cookie: "foo=bar; custom-token=abc123; another=1",
      },
    });

    expect(getSessionTokenFromRequest(req)).toBe("abc123");
  });

  it("returns default auth level when token is missing", async () => {
    const auth = await resolveAuthLevelFromToken(null);
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
      isPrimaryOfficer: false,
      isSeAdmin: false,
    });
  });

  it("returns elevated flags in staging mode even without token", async () => {
    const auth = await resolveAuthLevelFromToken(null, {
      stagingElevated: true,
    });
    expect(auth.isMentor).toBe(true);
    expect(auth.isOfficer).toBe(true);
    expect(auth.isMentoringHead).toBe(true);
    expect(auth.isProjectsHead).toBe(true);
    expect(auth.isTechCommitteeHead).toBe(true);
    expect(auth.isTechCommitteeDivisionManager).toBe(true);
    expect(auth.techCommitteeManagedDivision).toBe("Lab Division");
    expect(auth.isPrimary).toBe(true);
    expect(auth.isSeAdmin).toBe(true);
    // `isPrimaryOfficer` is NEVER elevated — without a DB record there is
    // no real primary position, so it stays false even in staging mode.
    expect(auth.isPrimaryOfficer).toBe(false);
  });

  it("computes auth flags and profile completeness from user record", async () => {
    mockFindFirst.mockResolvedValue({
      id: 42,
      graduationTerm: "FALL",
      graduationYear: 2027,
      major: "Software Engineering",
      gitHub: "sse",
      linkedIn: "sse",
      mentor: [{ id: 1 }],
      officers: [
        { id: 1, position: { title: "Mentoring Head", is_primary: true } },
        { id: 2, position: { title: "Tech Head", is_primary: false } },
        {
          id: 4,
          position: { title: "Lab Division Manager", is_primary: false },
        },
        { id: 3, position: { title: "Projects Head", is_primary: true } },
      ],
      _count: { Memberships: 2 },
    });

    const auth = await resolveAuthLevelFromToken("token", {
      includeProfileComplete: true,
    });

    expect(auth).toMatchObject({
      userId: 42,
      isUser: true,
      membershipCount: 2,
      isMember: true,
      isMentor: true,
      isOfficer: true,
      isMentoringHead: true,
      isProjectsHead: true,
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: true,
      techCommitteeManagedDivision: "Lab Division",
      isPrimary: true,
      profileComplete: true,
    });
  });

  it("uses request + staging helper in resolveAuthLevelFromRequest", async () => {
    mockGetSessionToken.mockReturnValue("token-from-cookie");
    mockHasStagingElevatedAccess.mockReturnValue(true);
    mockFindFirst.mockResolvedValue({
      id: 9,
      graduationTerm: null,
      graduationYear: null,
      major: null,
      gitHub: null,
      linkedIn: null,
      mentor: [],
      officers: [],
      _count: { Memberships: 0 },
    });

    const req = { cookies: {}, headers: new Headers() } as any;
    const auth = await resolveAuthLevelFromRequest(req, {
      includeProfileComplete: true,
    });

    expect(auth.userId).toBe(9);
    expect(auth.profileComplete).toBe(false);
    expect(auth.isOfficer).toBe(true);
    expect(auth.isTechCommitteeHead).toBe(true);
    expect(auth.isTechCommitteeDivisionManager).toBe(true);
    expect(auth.techCommitteeManagedDivision).toBe("Lab Division");
    expect(auth.isPrimary).toBe(true);
    // Regression guard: staging elevation must keep isSeAdmin=true even
    // when the logged-in user has no real SE Admin Officer row. An
    // unconditional `authLevel.isSeAdmin = …` assignment in
    // resolveAuthLevelFromToken used to silently flip this back to false
    // and lock staging devs out of isSeAdmin-gated dev endpoints.
    expect(auth.isSeAdmin).toBe(true);
    // `isPrimaryOfficer` must reflect DB truth even under staging — the
    // mocked user has no primary-officer position, so the flag stays
    // false. (Prevents regressions where the dashboard Elections item
    // would leak to non-primary staging users like the Tech Head.)
    expect(auth.isPrimaryOfficer).toBe(false);
  });
});
