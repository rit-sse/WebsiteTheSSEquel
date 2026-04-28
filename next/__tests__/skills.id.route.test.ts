import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    skill: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/skills/[id]/route";

describe("/api/skills/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns skill when found", async () => {
    mockFindUnique.mockResolvedValue({ skill: "TypeScript", mentorSkill: [] });

    const res = await GET(new Request("http://localhost/api/skills/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ skill: "TypeScript", mentorSkill: [] });
  });

  it("returns 404 when skill does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/skills/404"), {
      params: Promise.resolve({ id: "404" }),
    });

    expect(res.status).toBe(404);
  });
});
