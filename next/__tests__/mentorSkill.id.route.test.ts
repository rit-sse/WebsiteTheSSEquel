import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentorSkill: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/mentorSkill/[id]/route";

describe("/api/mentorSkill/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mentorSkill record when found", async () => {
    mockFindUnique.mockResolvedValue({ id: 1, mentor_Id: 2, skill_Id: 3 });

    const res = await GET(new Request("http://localhost/api/mentorSkill/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, mentor_Id: 2, skill_Id: 3 });
  });

  it("returns not-found message when mentorSkill is missing", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/mentorSkill/404"), {
      params: Promise.resolve({ id: "404" }),
    });

    expect(await res.text()).toContain("Couldn't find MentorSkill ID 404");
  });
});
