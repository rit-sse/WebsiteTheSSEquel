import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindMany,
  mockCount,
  mockCreate,
  mockFindUnique,
  mockMentorSkillDeleteMany,
  mockSkillDelete,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockMentorSkillDeleteMany: vi.fn(),
  mockSkillDelete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    skill: {
      findMany: mockFindMany,
      count: mockCount,
      create: mockCreate,
      findUnique: mockFindUnique,
      delete: mockSkillDelete,
    },
    mentorSkill: {
      deleteMany: mockMentorSkillDeleteMany,
    },
  },
}));

import { DELETE, GET, POST } from "@/app/api/skills/route";

describe("/api/skills route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns skills", async () => {
    mockFindMany.mockResolvedValue([{ skill: "TypeScript" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ skill: "TypeScript" }]);
  });

  it("POST requires skill in body", async () => {
    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("DELETE requires id in body", async () => {
    const req = new Request("http://localhost/api/skills", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("DELETE returns 404 when skill does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/skills", {
      method: "DELETE",
      body: JSON.stringify({ id: 7 }),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });
});
