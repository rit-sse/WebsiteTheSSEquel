import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    schedule: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/schedule/[id]/route";

describe("/api/schedule/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns schedule entry when found", async () => {
    mockFindUnique.mockResolvedValue({ id: 10, mentorId: 2, hourBlockId: 8 });

    const res = await GET(new Request("http://localhost/api/schedule/10"), {
      params: Promise.resolve({ id: "10" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 10, mentorId: 2, hourBlockId: 8 });
  });

  it("returns 404 for missing schedule entry", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/schedule/404"), {
      params: Promise.resolve({ id: "404" }),
    });

    expect(res.status).toBe(404);
  });
});
