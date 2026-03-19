import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockCreate, mockDeleteMany, mockDelete, mockUpdate } =
  vi.hoisted(() => ({
    mockFindMany: vi.fn(),
    mockCreate: vi.fn(),
    mockDeleteMany: vi.fn(),
    mockDelete: vi.fn(),
    mockUpdate: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  default: {
    course: {
      findMany: mockFindMany,
      create: mockCreate,
      delete: mockDelete,
      update: mockUpdate,
    },
    courseTaken: {
      deleteMany: mockDeleteMany,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/course/route";

describe("/api/course route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns all courses", async () => {
    mockFindMany.mockResolvedValue([{ id: 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1 }]);
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/course", {
      method: "POST",
      body: JSON.stringify({ title: "Course" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("DELETE returns 422 when id is missing", async () => {
    const req = new Request("http://localhost/api/course", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(422);
  });

  it("PUT updates course when id is provided", async () => {
    mockUpdate.mockResolvedValue({ id: 1, title: "Updated" });
    const req = new Request("http://localhost/api/course", {
      method: "PUT",
      body: JSON.stringify({ id: 1, title: "Updated" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, title: "Updated" });
  });
});
