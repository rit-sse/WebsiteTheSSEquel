import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockFindUnique,
  mockFindMany,
  mockFindFirst,
  mockUpdateMany,
  mockCreate,
  mockUpdate,
  mockDelete,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentorSchedule: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      updateMany: mockUpdateMany,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/mentorSchedule/route";

function req(url: string, method = "GET", body?: unknown) {
  return {
    method,
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/mentorSchedule route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: false,
      isPrimary: false,
    });
  });

  it("GET returns schedules list", async () => {
    mockFindMany.mockResolvedValue([{ id: 1, name: "S1" }]);

    const res = await GET(req("http://localhost/api/mentorSchedule"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, name: "S1" }]);
  });

  it("POST denies unauthorized users", async () => {
    const res = await POST(
      req("http://localhost/api/mentorSchedule", "POST", { name: "Spring" })
    );
    expect(res.status).toBe(403);
  });

  it("POST validates schedule name", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });

    const res = await POST(
      req("http://localhost/api/mentorSchedule", "POST", { name: "" })
    );
    expect(res.status).toBe(400);
  });

  it("POST creates schedule when canonical schedule does not exist", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 5, name: "Fresh", isActive: true });

    const res = await POST(
      req("http://localhost/api/mentorSchedule", "POST", { name: "Fresh" })
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 5, name: "Fresh", isActive: true });
  });

  it("PUT requires id", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });

    const res = await PUT(
      req("http://localhost/api/mentorSchedule", "PUT", { name: "Updated" })
    );
    expect(res.status).toBe(400);
  });

  it("DELETE requires id", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });

    const res = await DELETE(
      req("http://localhost/api/mentorSchedule", "DELETE", {})
    );
    expect(res.status).toBe(400);
  });
});
