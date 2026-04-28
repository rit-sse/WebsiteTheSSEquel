import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockFindFirst, mockCreate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    menteeHeadcountEntry: {
      findMany: mockFindMany,
      create: mockCreate,
    },
    mentorSemester: {
      findFirst: mockFindFirst,
    },
  },
}));

import { GET, POST } from "@/app/api/mentee-headcount/route";

function req(url: string, method = "GET", body?: unknown) {
  return {
    method,
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/mentee-headcount route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns entries", async () => {
    mockFindMany.mockResolvedValue([{ id: 1, studentsMentoredCount: 4 }]);

    const res = await GET(req("http://localhost/api/mentee-headcount"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, studentsMentoredCount: 4 }]);
  });

  it("POST validates mentorIds", async () => {
    const res = await POST(
      req("http://localhost/api/mentee-headcount", "POST", {
        mentorIds: [],
        studentsMentoredCount: 5,
        testsCheckedOutCount: 1,
      })
    );
    expect(res.status).toBe(400);
  });

  it("POST creates entry using active semester fallback", async () => {
    mockFindFirst.mockResolvedValue({ id: 7 });
    mockCreate.mockResolvedValue({ id: 22, semesterId: 7 });

    const res = await POST(
      req("http://localhost/api/mentee-headcount", "POST", {
        mentorIds: [1, 2],
        studentsMentoredCount: 5,
        testsCheckedOutCount: 2,
        courseIds: [10],
      })
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 22, semesterId: 7 });
    expect(mockCreate).toHaveBeenCalled();
  });
});
