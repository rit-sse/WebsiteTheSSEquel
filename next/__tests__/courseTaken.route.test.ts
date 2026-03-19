import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockMentorFindUnique,
  mockCourseTakenFindMany,
  mockCourseTakenFindUnique,
  mockCourseTakenCreate,
  mockCourseTakenUpdate,
  mockCourseTakenDelete,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockMentorFindUnique: vi.fn(),
  mockCourseTakenFindMany: vi.fn(),
  mockCourseTakenFindUnique: vi.fn(),
  mockCourseTakenCreate: vi.fn(),
  mockCourseTakenUpdate: vi.fn(),
  mockCourseTakenDelete: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentor: {
      findUnique: mockMentorFindUnique,
    },
    courseTaken: {
      findMany: mockCourseTakenFindMany,
      findUnique: mockCourseTakenFindUnique,
      create: mockCourseTakenCreate,
      update: mockCourseTakenUpdate,
      delete: mockCourseTakenDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/courseTaken/route";

describe("/api/courseTaken route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: false, userId: 9 });
    mockMentorFindUnique.mockResolvedValue({ user_Id: 9 });
  });

  it("GET returns courseTaken entries", async () => {
    mockCourseTakenFindMany.mockResolvedValue([
      { id: 1, mentorId: 2, courseId: 3 },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, mentorId: 2, courseId: 3 }]);
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/courseTaken", {
      method: "POST",
      body: JSON.stringify({ mentorId: 1 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("POST returns 403 when caller cannot modify mentor record", async () => {
    mockMentorFindUnique.mockResolvedValue({ user_Id: 77 });

    const req = new Request("http://localhost/api/courseTaken", {
      method: "POST",
      body: JSON.stringify({ mentorId: 1, courseId: 2 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("POST creates record when authorized", async () => {
    mockCourseTakenCreate.mockResolvedValue({
      id: 11,
      mentorId: 1,
      courseId: 2,
    });

    const req = new Request("http://localhost/api/courseTaken", {
      method: "POST",
      body: JSON.stringify({ mentorId: 1, courseId: 2 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 11, mentorId: 1, courseId: 2 });
  });

  it("PUT requires id in body", async () => {
    const req = new Request("http://localhost/api/courseTaken", {
      method: "PUT",
      body: JSON.stringify({ mentorId: 1 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("DELETE requires id in body", async () => {
    const req = new Request("http://localhost/api/courseTaken", {
      method: "DELETE",
      body: JSON.stringify({ mentorId: 1 }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await DELETE(req);
    expect(res.status).toBe(422);
  });
});
