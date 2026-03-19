import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetServerSession,
  mockGetGatewayAuthLevel,
  mockResolveUserImage,
  mockRecordMentorAvailabilityEvent,
  mockUserFindUnique,
  mockMentorAvailabilityFindMany,
  mockMentorAvailabilityFindUnique,
  mockMentorAvailabilityUpsert,
  mockMentorAvailabilityDelete,
  mockMentorAvailabilityDeleteMany,
  mockMentorSemesterFindUnique,
  mockMentorFindFirst,
  mockScheduleBlockFindMany,
  mockScheduleBlockDeleteMany,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockGetGatewayAuthLevel: vi.fn(),
  mockResolveUserImage: vi.fn(),
  mockRecordMentorAvailabilityEvent: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockMentorAvailabilityFindMany: vi.fn(),
  mockMentorAvailabilityFindUnique: vi.fn(),
  mockMentorAvailabilityUpsert: vi.fn(),
  mockMentorAvailabilityDelete: vi.fn(),
  mockMentorAvailabilityDeleteMany: vi.fn(),
  mockMentorSemesterFindUnique: vi.fn(),
  mockMentorFindFirst: vi.fn(),
  mockScheduleBlockFindMany: vi.fn(),
  mockScheduleBlockDeleteMany: vi.fn(),
}));

vi.mock("next-auth/next", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
}));

vi.mock("@/lib/mentorAvailabilityEvents", () => ({
  recordMentorAvailabilityEvent: mockRecordMentorAvailabilityEvent,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: mockUserFindUnique },
    mentorAvailability: {
      findMany: mockMentorAvailabilityFindMany,
      findUnique: mockMentorAvailabilityFindUnique,
      upsert: mockMentorAvailabilityUpsert,
      delete: mockMentorAvailabilityDelete,
      deleteMany: mockMentorAvailabilityDeleteMany,
    },
    mentorSemester: {
      findUnique: mockMentorSemesterFindUnique,
    },
    mentor: {
      findFirst: mockMentorFindFirst,
    },
    scheduleBlock: {
      findMany: mockScheduleBlockFindMany,
      deleteMany: mockScheduleBlockDeleteMany,
    },
  },
}));

import { DELETE, GET, POST } from "@/app/api/mentor-availability/route";

describe("/api/mentor-availability route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
  });

  it("GET my=true returns 401 when not logged in", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = new Request(
      "http://localhost/api/mentor-availability?my=true"
    ) as any;
    req.nextUrl = new URL("http://localhost/api/mentor-availability?my=true");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET aggregated mode requires semesterId", async () => {
    const req = new Request("http://localhost/api/mentor-availability") as any;
    req.nextUrl = new URL("http://localhost/api/mentor-availability");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("POST validates slots are an array", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "u@example.com" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 7, email: "u@example.com" });
    const req = new Request("http://localhost/api/mentor-availability", {
      method: "POST",
      body: JSON.stringify({ semesterId: 2, slots: "bad" }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST upserts availability and returns parsed slots", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "u@example.com" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 7, email: "u@example.com" });
    mockMentorSemesterFindUnique.mockResolvedValue({ id: 2, scheduleId: null });
    mockMentorAvailabilityUpsert.mockResolvedValue({
      id: 22,
      userId: 7,
      semesterId: 2,
      slots: JSON.stringify([{ weekday: 1, hour: 10 }]),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      semester: { id: 2, name: "Spring 2026" },
    });
    mockMentorFindFirst.mockResolvedValue(null);

    const req = new Request("http://localhost/api/mentor-availability", {
      method: "POST",
      body: JSON.stringify({
        semesterId: 2,
        slots: [{ weekday: 1, hour: 10 }],
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slots).toEqual([{ weekday: 1, hour: 10 }]);
    expect(mockRecordMentorAvailabilityEvent).toHaveBeenCalled();
  });

  it("DELETE denies deleting another user's availability without manager auth", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "u@example.com" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 7, email: "u@example.com" });
    mockMentorAvailabilityFindUnique.mockResolvedValue({ id: 99, userId: 10 });
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: false,
      isPrimary: false,
    });

    const req = new Request("http://localhost/api/mentor-availability", {
      method: "DELETE",
      body: JSON.stringify({ id: 99 }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });
});
