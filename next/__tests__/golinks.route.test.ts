import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate, mockDelete, mockUpdate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockDelete: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    goLinks: {
      create: mockCreate,
      delete: mockDelete,
      update: mockUpdate,
    },
  },
}));

import { DELETE, POST, PUT } from "@/app/api/golinks/route";

describe("/api/golinks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST validates golink format", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "POST",
      body: JSON.stringify({
        url: "https://example.com",
        golink: "Bad Link",
        description: "desc",
        isPinned: false,
        isPublic: true,
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("PUT returns 400 when id is missing", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "PUT",
      body: JSON.stringify({ golink: "abc" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("DELETE returns 400 when id is missing", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("POST creates golink when payload is valid", async () => {
    mockCreate.mockResolvedValue({ id: 10, golink: "abc" });
    const req = new Request("http://localhost/api/golinks", {
      method: "POST",
      body: JSON.stringify({
        url: "https://example.com",
        golink: "abc",
        description: "desc",
        isPinned: false,
        isPublic: true,
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
