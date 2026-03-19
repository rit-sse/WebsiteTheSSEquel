import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockFindUnique,
  mockUpdate,
  mockDelete,
  mockFindEvent,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockFindEvent: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    purchaseRequest: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
    event: {
      findUnique: mockFindEvent,
    },
  },
}));

import { DELETE, GET, PUT } from "@/app/api/purchasing/[id]/route";

describe("/api/purchasing/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 400 for invalid id", async () => {
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
  });

  it("GET returns purchase request when found", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindUnique.mockResolvedValue({ id: 3 });
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "3" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 3 });
  });

  it("PUT validates status enum", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindUnique.mockResolvedValue({ id: 3 });
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ status: "bad" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req as any, {
      params: Promise.resolve({ id: "3" }),
    });
    expect(res.status).toBe(422);
  });

  it("PUT returns 404 when eventId does not exist", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindUnique.mockResolvedValue({ id: 3 });
    mockFindEvent.mockResolvedValue(null);
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ eventId: "evt-1" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req as any, {
      params: Promise.resolve({ id: "3" }),
    });
    expect(res.status).toBe(404);
  });

  it("DELETE returns 404 when purchase request does not exist", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockFindUnique.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "3" }),
    });
    expect(res.status).toBe(404);
  });
});
