import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDeptFindMany,
  mockDeptCreate,
  mockCourseFindMany,
  mockCourseTakenDeleteMany,
  mockCourseDeleteMany,
  mockDeptDelete,
  mockDeptUpdate,
} = vi.hoisted(() => ({
  mockDeptFindMany: vi.fn(),
  mockDeptCreate: vi.fn(),
  mockCourseFindMany: vi.fn(),
  mockCourseTakenDeleteMany: vi.fn(),
  mockCourseDeleteMany: vi.fn(),
  mockDeptDelete: vi.fn(),
  mockDeptUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    department: {
      findMany: mockDeptFindMany,
      create: mockDeptCreate,
      delete: mockDeptDelete,
      update: mockDeptUpdate,
    },
    course: {
      findMany: mockCourseFindMany,
      deleteMany: mockCourseDeleteMany,
    },
    courseTaken: {
      deleteMany: mockCourseTakenDeleteMany,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/departments/route";

describe("/api/departments route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns departments", async () => {
    mockDeptFindMany.mockResolvedValue([{ id: 1, title: "CS" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, title: "CS" }]);
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/departments", {
      method: "POST",
      body: JSON.stringify({ title: "CS" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("DELETE validates id presence", async () => {
    const req = new Request("http://localhost/api/departments", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(422);
  });

  it("PUT validates id presence", async () => {
    const req = new Request("http://localhost/api/departments", {
      method: "PUT",
      body: JSON.stringify({ title: "New" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(422);
  });
});
