import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetServerSession,
  mockGetGatewayAuthLevel,
  mockFindMany,
  mockResolveUserImage,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockGetGatewayAuthLevel: vi.fn(),
  mockFindMany: vi.fn(),
  mockResolveUserImage: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));
vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));
vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findMany: mockFindMany },
  },
}));
vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
}));

import { GET } from "@/app/api/user/search/route";

describe("/api/user/search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue(null);
  });

  it("returns 401 when session is missing", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/user/search?q=test")
    );
    expect(res.status).toBe(401);
  });

  it("returns empty items when query is blank", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "x@example.com" },
    });
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: false });
    const res = await GET(
      new Request("http://localhost/api/user/search?q=   ")
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [] });
  });

  it("hides email for non-officers in search results", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "x@example.com" },
    });
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: false });
    mockFindMany.mockResolvedValue([
      {
        id: 1,
        name: "User",
        email: "user@example.com",
        profileImageKey: null,
        googleImageURL: null,
      },
    ]);
    const res = await GET(
      new Request("http://localhost/api/user/search?q=user")
    );
    const body = await res.json();
    expect(body.items[0]).toEqual({
      id: 1,
      name: "User",
      email: undefined,
      image: null,
    });
  });
});
