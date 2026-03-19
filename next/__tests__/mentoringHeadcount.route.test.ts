import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeadcountFindMany, mockHeadcountCreate, mockSemesterFindFirst } =
  vi.hoisted(() => ({
    mockHeadcountFindMany: vi.fn(),
    mockHeadcountCreate: vi.fn(),
    mockSemesterFindFirst: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentorHeadcountEntry: {
      findMany: mockHeadcountFindMany,
      create: mockHeadcountCreate,
    },
    mentorSemester: {
      findFirst: mockSemesterFindFirst,
    },
  },
}));

import { GET, POST } from "@/app/api/mentoring-headcount/route";

function req(url: string, method = "GET", body?: unknown) {
  return {
    method,
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/mentoring-headcount route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET traffic mode aggregates weekday hour buckets", async () => {
    mockHeadcountFindMany.mockResolvedValue([
      { peopleInLab: 4, createdAt: new Date("2026-03-02T14:00:00.000Z") }, // Monday
      { peopleInLab: 6, createdAt: new Date("2026-03-02T14:30:00.000Z") }, // Monday same hour
      { peopleInLab: 8, createdAt: new Date("2026-03-01T14:00:00.000Z") }, // Sunday ignored
    ]);

    const res = await GET(
      req("http://localhost/api/mentoring-headcount?traffic=true")
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveLength(1);
    const expectedHour = new Date("2026-03-02T14:00:00.000Z").getHours();
    expect(body[0]).toMatchObject({
      weekday: 1,
      hour: expectedHour,
      averagePeopleInLab: 5,
      sampleCount: 2,
    });
  });

  it("POST validates required feeling", async () => {
    const res = await POST(
      req("http://localhost/api/mentoring-headcount", "POST", {
        mentorIds: [1],
        peopleInLab: 5,
      })
    );

    expect(res.status).toBe(400);
  });

  it("POST creates entry using active semester fallback", async () => {
    mockSemesterFindFirst.mockResolvedValue({ id: 9 });
    mockHeadcountCreate.mockResolvedValue({ id: 33, semesterId: 9 });

    const res = await POST(
      req("http://localhost/api/mentoring-headcount", "POST", {
        mentorIds: [1],
        peopleInLab: 5,
        feeling: "busy",
      })
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 33, semesterId: 9 });
  });
});
