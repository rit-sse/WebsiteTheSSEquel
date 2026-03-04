import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    course: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/course/[id]/route";

describe("/api/course/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns course when found", async () => {
    mockFindUnique.mockResolvedValue({ title: "SWEN", code: 101 });

    const res = await GET(new Request("http://localhost/api/course/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ title: "SWEN", code: 101 });
  });

  it("returns 404 for missing course", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/course/404"), {
      params: Promise.resolve({ id: "404" }),
    });

    expect(res.status).toBe(404);
  });
});
