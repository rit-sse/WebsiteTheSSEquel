import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHasStagingElevatedAccess, mockResolveFromRequest, mockResolveFromToken } = vi.hoisted(
  () => ({
    mockHasStagingElevatedAccess: vi.fn(),
    mockResolveFromRequest: vi.fn(),
    mockResolveFromToken: vi.fn(),
  })
);

vi.mock("@/lib/proxyAuth", () => ({
  hasStagingElevatedAccess: mockHasStagingElevatedAccess,
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveFromRequest,
  resolveAuthLevelFromToken: mockResolveFromToken,
}));

import { GET, PUT } from "@/app/api/authLevel/route";

describe("/api/authLevel route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PUT returns 422 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/authLevel", {
      method: "PUT",
      body: "{",
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("PUT resolves auth level from provided token + staging", async () => {
    mockHasStagingElevatedAccess.mockReturnValue(true);
    mockResolveFromToken.mockResolvedValue({ isOfficer: true });

    const req = new Request("http://localhost/api/authLevel", {
      method: "PUT",
      body: JSON.stringify({ token: "abc" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);

    expect(mockResolveFromToken).toHaveBeenCalledWith("abc", {
      stagingElevated: true,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ isOfficer: true });
  });

  it("GET resolves auth level with profile completion flag", async () => {
    mockResolveFromRequest.mockResolvedValue({ isUser: true, profileComplete: true });

    const req = new Request("http://localhost/api/authLevel", {
      method: "GET",
    }) as any;
    const res = await GET(req);

    expect(mockResolveFromRequest).toHaveBeenCalledWith(req, {
      includeProfileComplete: true,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ isUser: true, profileComplete: true });
  });
});
