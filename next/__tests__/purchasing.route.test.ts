import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSessionToken, mockFindFirst, mockFindMany, mockCreate } = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findFirst: mockFindFirst },
    purchaseRequest: {
      findMany: mockFindMany,
      create: mockCreate,
    },
  },
}));

import { GET, POST } from "@/app/api/purchasing/route";

describe("/api/purchasing route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockGetSessionToken.mockReturnValue(null);
    const res = await GET(new Request("http://localhost/api/purchasing") as any);
    expect(res.status).toBe(401);
  });

  it("GET returns 404 when token has no user", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindFirst.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/purchasing") as any);
    expect(res.status).toBe(404);
  });

  it("GET returns purchase requests for valid user", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindFirst.mockResolvedValue({ id: 1 });
    mockFindMany.mockResolvedValue([{ id: 10 }, { id: 9 }]);

    const res = await GET(new Request("http://localhost/api/purchasing") as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 10 }, { id: 9 }]);
  });

  it("POST validates required fields", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindFirst.mockResolvedValue({ id: 1 });

    const req = new Request("http://localhost/api/purchasing", {
      method: "POST",
      body: JSON.stringify({ name: "x" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(422);
  });

  it("POST creates request for valid payload", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindFirst.mockResolvedValue({ id: 7 });
    mockCreate.mockResolvedValue({ id: 100, userId: 7 });

    const req = new Request("http://localhost/api/purchasing", {
      method: "POST",
      body: JSON.stringify({
        name: "Name",
        committee: "Projects",
        description: "Thing",
        estimatedCost: 42.5,
        plannedDate: "2026-03-04",
        notifyEmail: "test@example.com",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalled();
    expect(await res.json()).toEqual({ id: 100, userId: 7 });
  });
});
