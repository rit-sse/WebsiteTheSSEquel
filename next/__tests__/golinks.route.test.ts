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

  it("POST returns 422 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
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

  it("PUT returns 422 when id is missing", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "PUT",
      body: JSON.stringify({ golink: "abc" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("POST rejects javascript URLs", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "POST",
      body: JSON.stringify({
        url: "javascript:alert(1)",
        golink: "abc",
        description: "desc",
        isPinned: false,
        isPublic: true,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("POST rejects data URLs", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "POST",
      body: JSON.stringify({
        url: "data:text/html,<script>alert(1)</script>",
        golink: "abc",
        description: "desc",
        isPinned: false,
        isPublic: true,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
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

  it("POST accepts http URLs", async () => {
    mockCreate.mockResolvedValue({ id: 11, golink: "http-link" });
    const req = new Request("http://localhost/api/golinks", {
      method: "POST",
      body: JSON.stringify({
        url: "http://example.com",
        golink: "http-link",
        description: "desc",
        isPinned: false,
        isPublic: true,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("PUT rejects non-http URL updates", async () => {
    const req = new Request("http://localhost/api/golinks", {
      method: "PUT",
      body: JSON.stringify({ id: 5, url: "ftp://example.com/file.txt" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PUT(req);
    expect(res.status).toBe(422);
  });
});
