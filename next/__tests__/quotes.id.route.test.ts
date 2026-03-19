import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    quote: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/quotes/[id]/route";

describe("/api/quotes/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns quote when id exists", async () => {
    mockFindUnique.mockResolvedValue({ quote: "x", author: "a" });

    const res = await GET(new Request("http://localhost/api/quotes/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ quote: "x", author: "a" });
  });

  it("returns 404 when quote does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/quotes/111"), {
      params: Promise.resolve({ id: "111" }),
    });

    expect(res.status).toBe(404);
  });
});
