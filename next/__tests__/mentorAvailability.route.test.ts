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

  it("GET my=true returns parsed slots without legacy pre-noon hours", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "u@example.com" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 7, email: "u@example.com" });
    mockMentorAvailabilityFindMany.mockResolvedValue([
      {
        id: 22,
        userId: 7,
        semesterId: 2,
        slots: JSON.stringify([
          { weekday: 1, hour: 10 },
          { weekday: 1, hour: 11 },
          { weekday: 1, hour: 12 },
          { weekday: 5, hour: 17 },
        ]),
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        semester: { id: 2, name: "Fall 2026", isActive: true },
      },
    ]);

    const url = "http://localhost/api/mentor-availability?my=true&semesterId=2";
    const req = new Request(url) as any;
    req.nextUrl = new URL(url);

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Parsed to an array (not a raw JSON string) with legacy hours removed
    expect(body[0].slots).toEqual([
      { weekday: 1, hour: 12 },
      { weekday: 5, hour: 17 },
    ]);
    expect(body[0].semester).toEqual({
      id: 2,
      name: "Fall 2026",
      isActive: true,
    });
  });

  it("GET aggregated mode omits legacy pre-noon slots", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockMentorAvailabilityFindMany.mockResolvedValue([
      {
        userId: 7,
        semesterId: 2,
        slots: JSON.stringify([
          { weekday: 1, hour: 10 },
          { weekday: 1, hour: 11 },
          { weekday: 1, hour: 12 },
          { weekday: 5, hour: 17 },
          { weekday: 5, hour: 18 },
        ]),
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        user: {
          id: 7,
          name: "Mentor",
          email: "m@example.com",
          profileImageKey: null,
          googleImageURL: null,
        },
      },
    ]);

    const url = "http://localhost/api/mentor-availability?semesterId=2";
    const req = new Request(url) as any;
    req.nextUrl = new URL(url);

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].slots).toEqual([
      { weekday: 1, hour: 12 },
      { weekday: 5, hour: 17 },
    ]);
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

  it.each([
    { label: "10am", slots: [{ weekday: 1, hour: 10 }] },
    { label: "11am", slots: [{ weekday: 1, hour: 11 }] },
    { label: "6pm", slots: [{ weekday: 1, hour: 18 }] },
    {
      label: "a valid slot alongside 11am",
      slots: [
        { weekday: 1, hour: 12 },
        { weekday: 2, hour: 11 },
      ],
    },
  ])("POST rejects out-of-range availability: $label", async ({ slots }) => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "u@example.com" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 7, email: "u@example.com" });

    const req = new Request("http://localhost/api/mentor-availability", {
      method: "POST",
      body: JSON.stringify({ semesterId: 2, slots }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("hour must be 12-17");
    expect(mockMentorSemesterFindUnique).not.toHaveBeenCalled();
    expect(mockMentorAvailabilityUpsert).not.toHaveBeenCalled();
  });

  it("POST keeps legacy pre-noon schedule blocks when reconciling", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "u@example.com" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 7, email: "u@example.com" });
    mockMentorSemesterFindUnique.mockResolvedValue({ id: 2, scheduleId: 55 });
    mockMentorAvailabilityUpsert.mockResolvedValue({
      id: 22,
      userId: 7,
      semesterId: 2,
      slots: JSON.stringify([{ weekday: 1, hour: 12 }]),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      semester: { id: 2, name: "Fall 2026" },
    });
    mockMentorFindFirst.mockResolvedValue({ id: 3 });
    mockScheduleBlockFindMany.mockResolvedValue([
      { id: 1, weekday: 1, startHour: 10 }, // legacy: keep
      { id: 2, weekday: 1, startHour: 11 }, // legacy: keep
      { id: 3, weekday: 1, startHour: 12 }, // still available: keep
      { id: 4, weekday: 2, startHour: 13 }, // no longer available: remove
    ]);

    const req = new Request("http://localhost/api/mentor-availability", {
      method: "POST",
      body: JSON.stringify({
        semesterId: 2,
        slots: [{ weekday: 1, hour: 12 }],
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Only the in-range block that is no longer available is deleted
    expect(mockScheduleBlockDeleteMany).toHaveBeenCalledTimes(1);
    expect(mockScheduleBlockDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: [4] } },
    });

    const body = await res.json();
    expect(body.removedBlocks).toEqual([{ weekday: 2, startHour: 13 }]);
  });

  it("POST does not delete anything when only legacy blocks exist", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "u@example.com" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 7, email: "u@example.com" });
    mockMentorSemesterFindUnique.mockResolvedValue({ id: 2, scheduleId: 55 });
    mockMentorAvailabilityUpsert.mockResolvedValue({
      id: 22,
      userId: 7,
      semesterId: 2,
      slots: JSON.stringify([]),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      semester: { id: 2, name: "Fall 2026" },
    });
    mockMentorFindFirst.mockResolvedValue({ id: 3 });
    mockScheduleBlockFindMany.mockResolvedValue([
      { id: 1, weekday: 1, startHour: 10 },
      { id: 2, weekday: 3, startHour: 11 },
    ]);

    const req = new Request("http://localhost/api/mentor-availability", {
      method: "POST",
      body: JSON.stringify({ semesterId: 2, slots: [] }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockScheduleBlockDeleteMany).not.toHaveBeenCalled();
    expect((await res.json()).removedBlocks).toEqual([]);
  });

  it("POST accepts the 12pm and 5pm boundary hours", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "u@example.com" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 7, email: "u@example.com" });
    mockMentorSemesterFindUnique.mockResolvedValue({ id: 2, scheduleId: null });
    mockMentorAvailabilityUpsert.mockResolvedValue({
      id: 22,
      userId: 7,
      semesterId: 2,
      slots: JSON.stringify([
        { weekday: 1, hour: 12 },
        { weekday: 5, hour: 17 },
      ]),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      semester: { id: 2, name: "Spring 2026" },
    });
    mockMentorFindFirst.mockResolvedValue(null);

    const req = new Request("http://localhost/api/mentor-availability", {
      method: "POST",
      body: JSON.stringify({
        semesterId: 2,
        slots: [
          { weekday: 1, hour: 12 },
          { weekday: 5, hour: 17 },
        ],
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
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
      slots: JSON.stringify([{ weekday: 1, hour: 12 }]),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      semester: { id: 2, name: "Spring 2026" },
    });
    mockMentorFindFirst.mockResolvedValue(null);

    const req = new Request("http://localhost/api/mentor-availability", {
      method: "POST",
      body: JSON.stringify({
        semesterId: 2,
        slots: [{ weekday: 1, hour: 12 }],
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slots).toEqual([{ weekday: 1, hour: 12 }]);
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
