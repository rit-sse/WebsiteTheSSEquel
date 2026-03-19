import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequestFindMany,
  mockRequestCreate,
  mockRequestFindUnique,
  mockRequestUpdate,
  mockRequestDelete,
  mockAlumniFindUnique,
  mockAlumniCreate,
  mockAlumniUpdate,
  mockExecuteRaw,
} = vi.hoisted(() => ({
  mockRequestFindMany: vi.fn(),
  mockRequestCreate: vi.fn(),
  mockRequestFindUnique: vi.fn(),
  mockRequestUpdate: vi.fn(),
  mockRequestDelete: vi.fn(),
  mockAlumniFindUnique: vi.fn(),
  mockAlumniCreate: vi.fn(),
  mockAlumniUpdate: vi.fn(),
  mockExecuteRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    alumniRequest: {
      findMany: mockRequestFindMany,
      create: mockRequestCreate,
      findUnique: mockRequestFindUnique,
      update: mockRequestUpdate,
      delete: mockRequestDelete,
    },
    alumni: {
      findUnique: mockAlumniFindUnique,
      create: mockAlumniCreate,
      update: mockAlumniUpdate,
    },
    $executeRaw: mockExecuteRaw,
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/alumni-requests/route";

describe("/api/alumni-requests route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns alumni requests", async () => {
    mockRequestFindMany.mockResolvedValue([{ id: 1, status: "pending" }]);

    const res = await GET(new Request("http://localhost/api/alumni-requests"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, status: "pending" }]);
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/alumni-requests", {
      method: "POST",
      body: JSON.stringify({ name: "A" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("PUT validates status value", async () => {
    const req = new Request("http://localhost/api/alumni-requests", {
      method: "PUT",
      body: JSON.stringify({ id: 1, status: "bad" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("DELETE requires numeric id", async () => {
    const req = new Request("http://localhost/api/alumni-requests", {
      method: "DELETE",
      body: JSON.stringify({ id: "x" }),
      headers: { "content-type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("PUT uses safe raw execution before creating a new approved alumni record", async () => {
    mockRequestFindUnique.mockResolvedValue({
      id: 1,
      status: "pending",
      alumniId: null,
      name: "Alex",
      email: "alex@example.com",
      linkedIn: null,
      gitHub: null,
      description: null,
      image: null,
      start_date: "2020-01-01",
      end_date: "2024-01-01",
      quote: null,
      previous_roles: null,
      showEmail: false,
      receiveEmails: false,
    });
    mockRequestUpdate.mockResolvedValue({ id: 1, status: "approved" });

    const req = new Request("http://localhost/api/alumni-requests", {
      method: "PUT",
      body: JSON.stringify({ id: 1, status: "approved" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    expect(mockAlumniCreate).toHaveBeenCalledTimes(1);
  });
});
