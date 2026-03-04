import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentor: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/mentor/[id]/route";

describe("/api/mentor/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mentor when found", async () => {
    mockFindUnique.mockResolvedValue({ id: 1, isActive: true });

    const res = await GET(new Request("http://localhost/api/mentor/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, isActive: true });
  });

  it("returns 404 when mentor does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/mentor/99"), {
      params: Promise.resolve({ id: "99" }),
    });

    expect(res.status).toBe(404);
  });
});
