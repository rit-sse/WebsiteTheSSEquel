import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockFindMany,
  mockFindUnique,
  mockCreate,
  mockUpdate,
  mockDelete,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    project: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/project/route";

describe("/api/project route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({ isProjectsHead: false, isPrimary: false });
  });

  it("GET returns projects", async () => {
    mockFindMany.mockResolvedValue([{ id: 1, title: "Project" }]);

    const res = await GET(new Request("http://localhost/api/project"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, title: "Project" }]);
  });

  it("POST denies non-projects-head users", async () => {
    const req = new Request("http://localhost/api/project", {
      method: "POST",
      body: JSON.stringify({ title: "x", description: "d", leadid: 1, completed: false }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("POST creates project for authorized user with valid payload", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isProjectsHead: true, isPrimary: false });
    mockCreate.mockResolvedValue({ id: 2, title: "New" });

    const req = new Request("http://localhost/api/project", {
      method: "POST",
      body: JSON.stringify({
        title: "New",
        description: "Desc",
        leadid: 12,
        completed: false,
      }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 2, title: "New" });
  });

  it("PUT requires id in body", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isProjectsHead: true, isPrimary: false });

    const req = new Request("http://localhost/api/project", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated" }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("DELETE returns 404 when project does not exist", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isProjectsHead: true, isPrimary: false });
    mockFindUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/project", {
      method: "DELETE",
      body: JSON.stringify({ id: 44 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });
});
