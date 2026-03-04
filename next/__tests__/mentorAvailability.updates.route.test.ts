import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockMentorSemesterFindFirst,
  mockMentorAvailabilityFindMany,
  mockGetMentorAvailabilityEvent,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockMentorSemesterFindFirst: vi.fn(),
  mockMentorAvailabilityFindMany: vi.fn(),
  mockGetMentorAvailabilityEvent: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/mentorAvailabilityEvents", () => ({
  getMentorAvailabilityEvent: mockGetMentorAvailabilityEvent,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentorSemester: {
      findFirst: mockMentorSemesterFindFirst,
    },
    mentorAvailability: {
      findMany: mockMentorAvailabilityFindMany,
    },
  },
}));

import { GET } from "@/app/api/mentor-availability/updates/route";

describe("/api/mentor-availability/updates route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: false, isPrimary: false });
  });

  it("returns 403 when caller cannot manage mentoring", async () => {
    const res = await GET(new Request("http://localhost/api/mentor-availability/updates"));
    expect(res.status).toBe(403);
  });

  it("returns empty update payload when no active semester exists", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    mockMentorSemesterFindFirst.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/mentor-availability/updates"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      semester: null,
      latestUpdatedAt: null,
      updatedMentorCount: 0,
      updates: [],
    });
  });

  it("returns availability updates with removed blocks", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    mockMentorSemesterFindFirst.mockResolvedValue({ id: 2, name: "Spring 2026" });
    mockMentorAvailabilityFindMany.mockResolvedValue([
      {
        updatedAt: "2026-03-01T00:00:00.000Z",
        user: { id: 8, name: "Mentor", email: "mentor@g.rit.edu" },
      },
    ]);
    mockGetMentorAvailabilityEvent.mockReturnValue({ removedBlocks: [5, 6] });

    const res = await GET(new Request("http://localhost/api/mentor-availability/updates"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.updatedMentorCount).toBe(1);
    expect(body.updates[0]).toMatchObject({
      user: { id: 8, name: "Mentor", email: "mentor@g.rit.edu" },
      removedBlocks: [5, 6],
    });
  });
});
