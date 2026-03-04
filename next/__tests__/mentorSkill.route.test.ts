import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockMentorFindUnique,
  mockSkillFindUnique,
  mockMentorSkillFindMany,
  mockMentorSkillFindUnique,
  mockMentorSkillCreate,
  mockMentorSkillUpdate,
  mockMentorSkillDelete,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockMentorFindUnique: vi.fn(),
  mockSkillFindUnique: vi.fn(),
  mockMentorSkillFindMany: vi.fn(),
  mockMentorSkillFindUnique: vi.fn(),
  mockMentorSkillCreate: vi.fn(),
  mockMentorSkillUpdate: vi.fn(),
  mockMentorSkillDelete: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentor: {
      findUnique: mockMentorFindUnique,
    },
    skill: {
      findUnique: mockSkillFindUnique,
    },
    mentorSkill: {
      findMany: mockMentorSkillFindMany,
      findUnique: mockMentorSkillFindUnique,
      create: mockMentorSkillCreate,
      update: mockMentorSkillUpdate,
      delete: mockMentorSkillDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/mentorSkill/route";

describe("/api/mentorSkill route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: false, userId: 7 });
    mockMentorFindUnique.mockResolvedValue({ user_Id: 7 });
    mockMentorSkillFindUnique.mockResolvedValue({ id: 1, mentor_Id: 2, skill_Id: 3 });
    mockSkillFindUnique.mockResolvedValue({ id: 3 });
  });

  it("GET returns mentor-skill assignments", async () => {
    mockMentorSkillFindMany.mockResolvedValue([{ id: 1 }]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1 }]);
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/mentorSkill", {
      method: "POST",
      body: JSON.stringify({ mentor_Id: 1 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST denies unauthorized users", async () => {
    mockMentorFindUnique.mockResolvedValue({ user_Id: 999 });

    const req = new Request("http://localhost/api/mentorSkill", {
      method: "POST",
      body: JSON.stringify({ mentor_Id: 1, skill_Id: 2 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("POST creates mentor-skill when authorized", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: true, userId: 7 });
    mockMentorSkillCreate.mockResolvedValue({ id: 11, mentor_Id: 1, skill_Id: 2 });

    const req = new Request("http://localhost/api/mentorSkill", {
      method: "POST",
      body: JSON.stringify({ mentor_Id: 1, skill_Id: 2 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 11, mentor_Id: 1, skill_Id: 2 });
  });

  it("PUT requires id", async () => {
    const req = new Request("http://localhost/api/mentorSkill", {
      method: "PUT",
      body: JSON.stringify({ skill_Id: 2 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("DELETE denies unauthorized users", async () => {
    mockMentorSkillFindUnique.mockResolvedValue({ mentor_Id: 44 });
    mockMentorFindUnique.mockResolvedValue({ user_Id: 99 });

    const req = new Request("http://localhost/api/mentorSkill", {
      method: "DELETE",
      body: JSON.stringify({ id: 1 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });
});
