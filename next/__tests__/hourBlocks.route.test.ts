import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockFindMany,
  mockCreate,
  mockUpdate,
  mockDelete,
  mockFindUnique,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    hourBlock: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/hourBlocks/route";

describe("/api/hourBlocks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: false,
      isPrimary: false,
    });
    mockFindUnique.mockResolvedValue({ id: 1 });
  });

  it("GET returns hour blocks", async () => {
    mockFindMany.mockResolvedValue([{ id: 1, weekday: "Monday" }]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, weekday: "Monday" }]);
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/hourBlocks", {
      method: "POST",
      body: JSON.stringify({ weekday: "Monday" }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST denies unauthorized users", async () => {
    const req = new Request("http://localhost/api/hourBlocks", {
      method: "POST",
      body: JSON.stringify({
        weekday: "Monday",
        startTime: "2026-03-04T12:00:00.000Z",
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("POST creates hour block when authorized", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });
    mockCreate.mockResolvedValue({ id: 2, weekday: "Tuesday" });

    const req = new Request("http://localhost/api/hourBlocks", {
      method: "POST",
      body: JSON.stringify({
        weekday: "Tuesday",
        startTime: "2026-03-04T13:00:00.000Z",
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 2, weekday: "Tuesday" });
  });

  it("PUT requires id", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });

    const req = new Request("http://localhost/api/hourBlocks", {
      method: "PUT",
      body: JSON.stringify({ weekday: "Friday" }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("DELETE requires id", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });

    const req = new Request("http://localhost/api/hourBlocks", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await DELETE(req);
    expect(res.status).toBe(422);
  });
});
