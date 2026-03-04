import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    hourBlock: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/hourBlocks/[id]/route";

describe("/api/hourBlocks/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns hour block when found", async () => {
    mockFindUnique.mockResolvedValue({ weekday: "Monday", startTime: "09:00" });

    const res = await GET(new Request("http://localhost/api/hourBlocks/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ weekday: "Monday", startTime: "09:00" });
  });

  it("returns 404 for missing hour block", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/hourBlocks/404"), {
      params: Promise.resolve({ id: "404" }),
    });

    expect(res.status).toBe(404);
  });
});
