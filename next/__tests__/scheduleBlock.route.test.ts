import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockResolveUserImage,
  mockMentorScheduleFindFirst,
  mockMentorFindUnique,
  mockScheduleBlockFindFirst,
  mockScheduleBlockCreate,
  mockScheduleBlockDeleteMany,
  mockScheduleBlockFindUnique,
  mockScheduleBlockDelete,
  mockScheduleBlockUpdate,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockResolveUserImage: vi.fn(),
  mockMentorScheduleFindFirst: vi.fn(),
  mockMentorFindUnique: vi.fn(),
  mockScheduleBlockFindFirst: vi.fn(),
  mockScheduleBlockCreate: vi.fn(),
  mockScheduleBlockDeleteMany: vi.fn(),
  mockScheduleBlockFindUnique: vi.fn(),
  mockScheduleBlockDelete: vi.fn(),
  mockScheduleBlockUpdate: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentorSchedule: {
      findFirst: mockMentorScheduleFindFirst,
    },
    mentor: {
      findUnique: mockMentorFindUnique,
    },
    scheduleBlock: {
      findFirst: mockScheduleBlockFindFirst,
      create: mockScheduleBlockCreate,
      deleteMany: mockScheduleBlockDeleteMany,
      findUnique: mockScheduleBlockFindUnique,
      delete: mockScheduleBlockDelete,
      update: mockScheduleBlockUpdate,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/scheduleBlock/route";

describe("/api/scheduleBlock route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
  });

  it("GET returns empty payload when no schedule exists", async () => {
    mockMentorScheduleFindFirst.mockResolvedValue(null);
    const req = new Request("http://localhost/api/scheduleBlock") as any;
    req.nextUrl = new URL("http://localhost/api/scheduleBlock");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ schedule: null, blocks: [] });
  });

  it("POST returns 403 when user cannot manage schedules", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: false, isPrimary: false });
    const req = new Request("http://localhost/api/scheduleBlock", {
      method: "POST",
      body: JSON.stringify({ mentorId: 1, weekday: 1, startHour: 10 }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("POST validates weekday bounds", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    const req = new Request("http://localhost/api/scheduleBlock", {
      method: "POST",
      body: JSON.stringify({ mentorId: 1, weekday: 9, startHour: 10 }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST creates block when valid", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    mockMentorScheduleFindFirst.mockResolvedValue({ id: 55 });
    mockMentorFindUnique.mockResolvedValue({ id: 7, isActive: true });
    mockScheduleBlockFindFirst.mockResolvedValue(null);
    mockScheduleBlockCreate.mockResolvedValue({
      id: 99,
      mentor: {
        user: { profileImageKey: null, googleImageURL: "https://example.com/avatar.png" },
      },
    });

    const req = new Request("http://localhost/api/scheduleBlock", {
      method: "POST",
      body: JSON.stringify({ mentorId: 7, weekday: 1, startHour: 10 }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(99);
    expect(body.mentor.user.image).toBe("resolved-image");
  });

  it("PUT returns 404 when schedule block does not exist", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    mockScheduleBlockFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/scheduleBlock", {
      method: "PUT",
      body: JSON.stringify({ id: 123, weekday: 1, startHour: 10 }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await PUT(req);
    expect(res.status).toBe(404);
  });

  it("DELETE by scheduleId removes all blocks for schedule", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    const req = new Request("http://localhost/api/scheduleBlock", {
      method: "DELETE",
      body: JSON.stringify({ scheduleId: "55" }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(mockScheduleBlockDeleteMany).toHaveBeenCalledWith({ where: { scheduleId: 55 } });
  });
});
