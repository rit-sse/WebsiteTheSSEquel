import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockScheduleFindMany,
  mockScheduleCreate,
  mockScheduleUpdate,
  mockScheduleDelete,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockScheduleFindMany: vi.fn(),
  mockScheduleCreate: vi.fn(),
  mockScheduleUpdate: vi.fn(),
  mockScheduleDelete: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    schedule: {
      findMany: mockScheduleFindMany,
      create: mockScheduleCreate,
      update: mockScheduleUpdate,
      delete: mockScheduleDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/schedule/route";

describe("/api/schedule route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: false, isPrimary: false });
  });

  it("GET returns schedule entries", async () => {
    mockScheduleFindMany.mockResolvedValue([{ id: 1 }]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1 }]);
  });

  it("POST denies non-mentoring-head users", async () => {
    const req = new Request("http://localhost/api/schedule", {
      method: "POST",
      body: JSON.stringify({ mentorId: 1, hourBlockId: 2 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("POST validates required fields", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });

    const req = new Request("http://localhost/api/schedule", {
      method: "POST",
      body: JSON.stringify({ mentorId: 1 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("PUT updates schedule when authorized", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    mockScheduleUpdate.mockResolvedValue({ id: 3, mentorId: 9, hourBlockId: 5 });

    const req = new Request("http://localhost/api/schedule", {
      method: "PUT",
      body: JSON.stringify({ id: 3, mentorId: 9, hourBlockId: 5 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 3, mentorId: 9, hourBlockId: 5 });
  });

  it("DELETE returns 404 when Prisma delete fails", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    mockScheduleDelete.mockRejectedValue(new Error("missing"));

    const req = new Request("http://localhost/api/schedule", {
      method: "DELETE",
      body: JSON.stringify({ id: 999 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });
});
