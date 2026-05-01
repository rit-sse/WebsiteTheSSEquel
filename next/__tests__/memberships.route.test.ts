import { beforeEach, describe, expect, it, vi } from "vitest";
import { MANUAL_MEMBERSHIP_REASONS } from "@/lib/membershipUtils";

const {
  mockMembershipsGroupBy,
  mockUserFindMany,
  mockMembershipsCreate,
  mockResolveUserImage,
  mockGetCurrentSseOperationalTerm,
} = vi.hoisted(() => ({
  mockMembershipsGroupBy: vi.fn(),
  mockUserFindMany: vi.fn(),
  mockMembershipsCreate: vi.fn(),
  mockResolveUserImage: vi.fn(),
  mockGetCurrentSseOperationalTerm: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    memberships: {
      groupBy: mockMembershipsGroupBy,
      create: mockMembershipsCreate,
    },
    user: {
      findMany: mockUserFindMany,
    },
  },
}));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

vi.mock("@/lib/sseTerms", () => ({
  getCurrentSseOperationalTerm: mockGetCurrentSseOperationalTerm,
}));

import { GET, POST } from "@/app/api/memberships/route";

describe("/api/memberships route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
    mockGetCurrentSseOperationalTerm.mockReturnValue({
      term: "SPRING",
      year: 2026,
    });
  });

  it("GET aggregates memberships per user for the active SSE term", async () => {
    mockMembershipsGroupBy.mockResolvedValue([
      {
        userId: 10,
        _count: { userId: 2 },
        _max: { dateGiven: "2026-01-01T00:00:00.000Z" },
      },
    ]);
    mockUserFindMany.mockResolvedValue([
      {
        id: 10,
        name: "Test User",
        profileImageKey: null,
        googleImageURL: null,
      },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockMembershipsGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { term: "SPRING", year: 2026 },
      })
    );
    expect(await res.json()).toEqual([
      {
        userId: 10,
        name: "Test User",
        image: "resolved-image",
        membershipCount: 2,
        lastMembershipAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("POST returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: "not-json",
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: JSON.stringify({ userId: 1 }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST creates a membership record for valid input", async () => {
    mockGetCurrentSseOperationalTerm.mockReturnValue({
      term: "SPRING",
      year: 2026,
    });
    mockMembershipsCreate.mockResolvedValue({
      id: 1,
      userId: 15,
      reason: "Event Attendance",
      dateGiven: "2026-02-01T00:00:00.000Z",
    });

    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: JSON.stringify({
        userId: 15,
        reason: "Event Attendance",
        dateGiven: "2026-02-01",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockGetCurrentSseOperationalTerm).toHaveBeenCalledWith(
      new Date("2026-02-01T00:00:00.000Z")
    );
    expect(mockMembershipsCreate).toHaveBeenCalledWith({
      data: {
        userId: 15,
        reason: "Event Attendance",
        dateGiven: "2026-02-01T00:00:00.000Z",
        term: "SPRING",
        year: 2026,
      },
      select: { id: true, userId: true, reason: true, dateGiven: true },
    });
    expect(await res.json()).toEqual({
      id: 1,
      userId: 15,
      reason: "Event Attendance",
      dateGiven: "2026-02-01T00:00:00.000Z",
    });
  });

  it("POST uses SSE operational terms so summer dates land in Fall", async () => {
    mockGetCurrentSseOperationalTerm.mockReturnValue({
      term: "FALL",
      year: 2026,
    });
    mockMembershipsCreate.mockResolvedValue({
      id: 2,
      userId: 15,
      reason: "Event Attendance",
      dateGiven: "2026-06-15T00:00:00.000Z",
    });

    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: JSON.stringify({
        userId: 15,
        reason: "Event Attendance",
        dateGiven: "2026-06-15",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockMembershipsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          term: "FALL",
          year: 2026,
        }),
      })
    );
  });

  it("POST rejects unsupported manual reasons", async () => {
    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: JSON.stringify({
        userId: 15,
        reason: "Freeform Reason",
        dateGiven: "2026-02-01",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockMembershipsCreate).not.toHaveBeenCalled();
  });

  it("manual reason list stays stable for the memberships UI", () => {
    expect(MANUAL_MEMBERSHIP_REASONS).toEqual([
      "Event Attendance",
      "Lab Cleaning",
      "Mentoring Support",
      "Volunteer Work",
      "Donation",
      "Other Approved Contribution",
    ]);
  });
});
