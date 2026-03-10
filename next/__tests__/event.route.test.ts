import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEventFindMany, mockEventCreate, mockEventDelete, mockEventUpdate } = vi.hoisted(() => ({
  mockEventFindMany: vi.fn(),
  mockEventCreate: vi.fn(),
  mockEventDelete: vi.fn(),
  mockEventUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      findMany: mockEventFindMany,
      create: mockEventCreate,
      delete: mockEventDelete,
      update: mockEventUpdate,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/event/route";

describe("/api/event route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns events list", async () => {
    mockEventFindMany.mockResolvedValue([{ id: "e1" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "e1" }]);
  });

  it("GET returns 500 on DB failure", async () => {
    mockEventFindMany.mockRejectedValue(new Error("db"));
    const res = await GET();
    expect(res.status).toBe(500);
  });

  it("POST returns 422 for missing required fields", async () => {
    const req = new Request("http://localhost/api/event", {
      method: "POST",
      body: JSON.stringify({ title: "x" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("POST creates event with valid payload", async () => {
    mockEventCreate.mockResolvedValue({ id: "evt-1" });
    const req = new Request("http://localhost/api/event", {
      method: "POST",
      body: JSON.stringify({
        id: "evt-1",
        title: "Title",
        description: "Desc",
        date: "2026-03-04T12:00:00.000Z",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("DELETE returns 400 when id missing", async () => {
    const req = new Request("http://localhost/api/event", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("PUT returns 422 when id missing", async () => {
    const req = new Request("http://localhost/api/event", {
      method: "PUT",
      body: JSON.stringify({ title: "x" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("PUT updates event when id is provided", async () => {
    mockEventUpdate.mockResolvedValue({ id: "evt-1", title: "Updated" });
    const req = new Request("http://localhost/api/event", {
      method: "PUT",
      body: JSON.stringify({ id: "evt-1", title: "Updated" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "evt-1", title: "Updated" });
  });
});
