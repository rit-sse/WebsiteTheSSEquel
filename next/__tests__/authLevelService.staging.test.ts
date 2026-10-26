import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockHeaders,
  mockGetServerSession,
  mockIsStagingProxyAuthEnabled,
  mockGetProxyEmail,
  mockResolveAuthLevelFromProxyEmail,
  mockFindFirst,
} = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockGetServerSession: vi.fn(),
  mockIsStagingProxyAuthEnabled: vi.fn(),
  mockGetProxyEmail: vi.fn(),
  mockResolveAuthLevelFromProxyEmail: vi.fn(),
  mockFindFirst: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mockHeaders }));
vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  default: { user: { findFirst: mockFindFirst } },
}));
vi.mock("@/lib/proxyAuth", () => ({
  isStagingProxyAuthEnabled: mockIsStagingProxyAuthEnabled,
  getProxyEmail: mockGetProxyEmail,
}));
vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromProxyEmail: mockResolveAuthLevelFromProxyEmail,
}));

import { getAuthLevel } from "@/lib/services/authLevelService";

describe("getAuthLevel under STAGING_PROXY_AUTH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockResolveAuthLevelFromProxyEmail.mockResolvedValue({ isOfficer: true });
  });

  it("elevates using the proxy email header when present", async () => {
    mockIsStagingProxyAuthEnabled.mockReturnValue(true);
    mockGetProxyEmail.mockReturnValue("proxy@rit.edu");

    await getAuthLevel();

    expect(mockResolveAuthLevelFromProxyEmail).toHaveBeenCalledWith(
      "proxy@rit.edu",
      { includeProfileComplete: true, stagingElevated: true }
    );
    expect(mockGetServerSession).not.toHaveBeenCalled();
  });

  it("elevates the NextAuth session user when the proxy header is missing", async () => {
    mockIsStagingProxyAuthEnabled.mockReturnValue(true);
    mockGetProxyEmail.mockReturnValue(null);
    mockGetServerSession.mockResolvedValue({
      user: { email: "dev@g.rit.edu" },
    });

    const auth = await getAuthLevel();

    expect(mockResolveAuthLevelFromProxyEmail).toHaveBeenCalledWith(
      "dev@g.rit.edu",
      { includeProfileComplete: true, stagingElevated: true }
    );
    expect(auth).toEqual({ isOfficer: true });
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("does not elevate when the flag is off", async () => {
    mockIsStagingProxyAuthEnabled.mockReturnValue(false);
    mockGetServerSession.mockResolvedValue(null);

    const auth = await getAuthLevel();

    expect(mockResolveAuthLevelFromProxyEmail).not.toHaveBeenCalled();
    expect(auth.isOfficer).toBe(false);
  });
});
