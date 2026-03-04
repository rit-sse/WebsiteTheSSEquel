import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockCreate, mockFindUnique, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    sponsor: {
      findMany: mockFindMany,
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/sponsor/route";

describe("/api/sponsor route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns sponsors", async () => {
    mockFindMany.mockResolvedValue([{ id: 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1 }]);
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/sponsor", {
      method: "POST",
      body: JSON.stringify({ name: "Acme" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("PUT requires numeric id", async () => {
    const req = new Request("http://localhost/api/sponsor", {
      method: "PUT",
      body: JSON.stringify({ id: "bad" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req as any);
    expect(res.status).toBe(422);
  });

  it("DELETE returns 404 for missing sponsor", async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/sponsor", {
      method: "DELETE",
      body: JSON.stringify({ id: 99 }),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req as any);
    expect(res.status).toBe(404);
  });
});
