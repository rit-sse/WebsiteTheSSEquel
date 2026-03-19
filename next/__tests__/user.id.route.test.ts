import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindUnique,
  mockGetServerSession,
  mockGetGatewayAuthLevel,
  mockResolveUserImage,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockGetServerSession: vi.fn(),
  mockGetGatewayAuthLevel: vi.fn(),
  mockResolveUserImage: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: mockFindUnique },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));
vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));
vi.mock("@/lib/s3Utils", () => ({ resolveUserImage: mockResolveUserImage }));

import { GET } from "@/app/api/user/[id]/route";

describe("/api/user/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
  });

  it("returns 404 when user does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "3" }),
    });
    expect(res.status).toBe(404);
  });

  it("hides email for non-owner non-officer", async () => {
    mockFindUnique.mockResolvedValue({
      id: 3,
      name: "User",
      email: "user@example.com",
      profileImageKey: null,
      googleImageURL: null,
    });
    mockGetServerSession.mockResolvedValue({
      user: { email: "other@example.com" },
    });
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: false });

    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "3" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBeUndefined();
    expect(body.image).toBe("resolved-image");
  });

  it("shows email for officer", async () => {
    mockFindUnique.mockResolvedValue({
      id: 3,
      name: "User",
      email: "user@example.com",
      profileImageKey: null,
      googleImageURL: null,
    });
    mockGetServerSession.mockResolvedValue({
      user: { email: "other@example.com" },
    });
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: true });

    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "3" }),
    });
    const body = await res.json();
    expect(body.email).toBe("user@example.com");
  });
});
