import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    textbooks: {
      findMany: mockFindMany,
    },
  },
}));

import { GET } from "@/app/api/library/search/route";

function req(url: string) {
  return { nextUrl: new URL(url) } as any;
}

describe("/api/library/search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when query is missing", async () => {
    const res = await GET(req("http://localhost/api/library/search"));
    expect(res.status).toBe(400);
  });

  it("returns matching books for valid query", async () => {
    mockFindMany.mockResolvedValue([{ ISBN: "123", name: "Algorithms" }]);

    const res = await GET(req("http://localhost/api/library/search?query=algo"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ ISBN: "123", name: "Algorithms" }]);
  });
});
