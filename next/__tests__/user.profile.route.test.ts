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
    mockGetGatewayAuthLevel.mockResolvedValue({ userId: 99, isOfficer: true });
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

  it("returns 401 without reading the user when signed out", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser());
    mockGetGatewayAuthLevel.mockResolvedValue({
      userId: null,
      isOfficer: false,
    });

    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "12" }),
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-in non-owner non-officer", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser());
    mockGetGatewayAuthLevel.mockResolvedValue({ userId: 99, isOfficer: false });

    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "12" }),
    });
    expect(res.status).toBe(403);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
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

  it("omits legacy pre-noon shifts and availability from mentor profile", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ userId: 12, isOfficer: false });
    mockMentorSemesterFindFirst.mockResolvedValue({ id: 2 });
    mockMentorAvailabilityFindUnique.mockResolvedValue({
      slots: JSON.stringify([
        { weekday: 1, hour: 10 },
        { weekday: 2, hour: 11 },
        { weekday: 3, hour: 12 },
        { weekday: 4, hour: 17 },
      ]),
    });
    mockUserFindUnique.mockResolvedValue({
      ...baseUser(),
      mentor: [
        {
          id: 5,
          isActive: true,
          expirationDate: null,
          scheduleBlocks: [
            { id: 1, weekday: 1, startHour: 10 },
            { id: 2, weekday: 1, startHour: 11 },
            { id: 3, weekday: 1, startHour: 12 },
            { id: 4, weekday: 5, startHour: 17 },
          ],
        },
      ],
    });

    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "12" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mentorProfile.shifts.map((s: any) => s.label)).toEqual([
      "Monday 12:00-13:00",
      "Friday 17:00-18:00",
    ]);
    expect(body.mentorProfile.availability).toEqual([
      { weekday: 3, hour: 12 },
      { weekday: 4, hour: 17 },
    ]);
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
