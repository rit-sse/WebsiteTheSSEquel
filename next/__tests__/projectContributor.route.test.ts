import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockCreate, mockFindUnique, mockUpdate, mockDelete } =
  vi.hoisted(() => ({
    mockFindMany: vi.fn(),
    mockCreate: vi.fn(),
    mockFindUnique: vi.fn(),
    mockUpdate: vi.fn(),
    mockDelete: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  default: {
    projectContributor: {
      findMany: mockFindMany,
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/projectContributor/route";

describe("/api/projectContributor route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns contributors", async () => {
    mockFindMany.mockResolvedValue([{ id: 1 }]);
    const res = await GET(new Request("http://localhost"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1 }]);
  });

  it("POST requires both userId and projectId", async () => {
    const req = new Request("http://localhost/api/projectContributor", {
      method: "POST",
      body: JSON.stringify({ userId: 1 }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("PUT returns 404 when id does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/projectContributor", {
      method: "PUT",
      body: JSON.stringify({ id: 10 }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(404);
  });

  it("DELETE returns invalid JSON error on bad payload", async () => {
    const req = new Request("http://localhost/api/projectContributor", {
      method: "DELETE",
      body: "{",
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(422);
  });
});
