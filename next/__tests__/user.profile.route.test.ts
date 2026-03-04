import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockResolveUserImage,
  mockUserFindUnique,
  mockOfficerFindFirst,
  mockMentorSemesterFindFirst,
  mockMentorAvailabilityFindUnique,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockResolveUserImage: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockOfficerFindFirst: vi.fn(),
  mockMentorSemesterFindFirst: vi.fn(),
  mockMentorAvailabilityFindUnique: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: mockUserFindUnique },
    officer: { findFirst: mockOfficerFindFirst },
    mentorSemester: { findFirst: mockMentorSemesterFindFirst },
    mentorAvailability: { findUnique: mockMentorAvailabilityFindUnique },
  },
}));

import { GET } from "@/app/api/user/[id]/profile/route";

function baseUser() {
  return {
    id: 12,
    name: "Test User",
    email: "user@example.com",
    profileImageKey: null,
    googleImageURL: "https://example.com/avatar.png",
    linkedIn: "li",
    gitHub: "gh",
    description: "desc",
    graduationTerm: "FALL",
    graduationYear: 2027,
    major: "SE",
    coopSummary: null,
    Memberships: [],
    projectContributions: [],
    officers: [],
    mentor: [],
    mentorApplications: [],
  };
}

describe("/api/user/[id]/profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
    mockOfficerFindFirst.mockResolvedValue(null);
    mockMentorSemesterFindFirst.mockResolvedValue(null);
    mockMentorAvailabilityFindUnique.mockResolvedValue(null);
  });

  it("returns 422 for invalid user id", async () => {
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(422);
  });

  it("returns 404 when user is missing", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "12" }),
    });
    expect(res.status).toBe(404);
  });

  it("hides email for non-owner non-officer", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser());
    mockGetGatewayAuthLevel.mockResolvedValue({ userId: 99, isOfficer: false });

    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "12" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBeUndefined();
    expect(body.image).toBe("resolved-image");
  });

  it("shows email for officer", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser());
    mockGetGatewayAuthLevel.mockResolvedValue({ userId: 99, isOfficer: true });

    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "12" }),
    });
    const body = await res.json();
    expect(body.email).toBe("user@example.com");
  });

  it("shows email for owner", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser());
    mockGetGatewayAuthLevel.mockResolvedValue({ userId: 12, isOfficer: false });

    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "12" }),
    });
    const body = await res.json();
    expect(body.email).toBe("user@example.com");
    expect(body.isOwner).toBe(true);
  });
});
