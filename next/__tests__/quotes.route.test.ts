import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockQuoteFindMany,
  mockQuoteCreate,
  mockQuoteUpdate,
  mockQuoteDelete,
  mockUserFindUnique,
  mockUserFindUniqueOrThrow,
  mockUserFindFirst,
  mockQuoteFindUnique,
} = vi.hoisted(() => ({
  mockQuoteFindMany: vi.fn(),
  mockQuoteCreate: vi.fn(),
  mockQuoteUpdate: vi.fn(),
  mockQuoteDelete: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserFindUniqueOrThrow: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockQuoteFindUnique: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: vi.fn(() => "token"),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    quote: {
      findMany: mockQuoteFindMany,
      create: mockQuoteCreate,
      update: mockQuoteUpdate,
      delete: mockQuoteDelete,
      findUnique: mockQuoteFindUnique,
    },
    user: {
      findUnique: mockUserFindUnique,
      findUniqueOrThrow: mockUserFindUniqueOrThrow,
      findFirst: mockUserFindFirst,
    },
  },
}));

vi.mock("next-auth/react", () => ({
  getSession: vi.fn(),
}));

import { DELETE, GET, POST, PUT } from "@/app/api/quotes/route";

describe("/api/quotes route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUniqueOrThrow.mockResolvedValue({ id: 1 });
    mockUserFindFirst.mockResolvedValue({ id: 1 });
    mockQuoteFindUnique.mockResolvedValue({ id: 1 });
  });

  it("GET returns quote list", async () => {
    mockQuoteFindMany.mockResolvedValue([{ id: 1, quote: "hello" }]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, quote: "hello" }]);
  });

  it("POST returns 422 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({ quote: "x" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("POST returns 404 when user is not found", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        dateAdded: "2026-03-03T00:00:00.000Z",
        quote: "x",
        userId: 44,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("POST creates quote with valid payload", async () => {
    mockUserFindUnique.mockResolvedValue({ id: 2 });
    mockQuoteCreate.mockResolvedValue({ id: 9, quote: "created" });

    const req = new Request("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        dateAdded: "2026-03-03T00:00:00.000Z",
        quote: "created",
        userId: 2,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 9, quote: "created" });
  });

  it("PUT requires id in body", async () => {
    const req = new Request("http://localhost/api/quotes", {
      method: "PUT",
      body: JSON.stringify({ quote: "new" }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("DELETE requires quote id in body", async () => {
    const req = new Request("http://localhost/api/quotes", {
      method: "DELETE",
      body: JSON.stringify({ userId: 1 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});
