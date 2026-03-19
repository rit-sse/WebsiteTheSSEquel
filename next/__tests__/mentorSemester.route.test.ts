import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockGetCurrentSemester,
  mockParseAcademicTermLabel,
  mockGetAcademicTermDateRange,
  mockSemesterFindUnique,
  mockSemesterFindMany,
  mockSemesterCreate,
  mockSemesterUpdate,
  mockSemesterDelete,
  mockSemesterUpdateMany,
  mockScheduleFindFirst,
  mockScheduleCreate,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockGetCurrentSemester: vi.fn(),
  mockParseAcademicTermLabel: vi.fn(),
  mockGetAcademicTermDateRange: vi.fn(),
  mockSemesterFindUnique: vi.fn(),
  mockSemesterFindMany: vi.fn(),
  mockSemesterCreate: vi.fn(),
  mockSemesterUpdate: vi.fn(),
  mockSemesterDelete: vi.fn(),
  mockSemesterUpdateMany: vi.fn(),
  mockScheduleFindFirst: vi.fn(),
  mockScheduleCreate: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/semester", () => ({
  getCurrentSemester: mockGetCurrentSemester,
}));

vi.mock("@/lib/academicTerm", () => ({
  parseAcademicTermLabel: mockParseAcademicTermLabel,
  getAcademicTermDateRange: mockGetAcademicTermDateRange,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentorSemester: {
      findUnique: mockSemesterFindUnique,
      findMany: mockSemesterFindMany,
      create: mockSemesterCreate,
      update: mockSemesterUpdate,
      delete: mockSemesterDelete,
      updateMany: mockSemesterUpdateMany,
    },
    mentorSchedule: {
      findFirst: mockScheduleFindFirst,
      create: mockScheduleCreate,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/mentor-semester/route";

function req(url: string, method = "GET", body?: unknown) {
  return {
    method,
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/mentor-semester route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: false,
      isPrimary: false,
    });
    mockGetCurrentSemester.mockReturnValue({ label: "Spring 2026" });
    mockParseAcademicTermLabel.mockReturnValue({ term: "SPRING", year: 2026 });
    mockGetAcademicTermDateRange.mockReturnValue({
      startDate: new Date("2026-01-10T00:00:00.000Z"),
      endDate: new Date("2026-05-05T00:00:00.000Z"),
    });
  });

  it("GET returns semester list", async () => {
    mockSemesterFindMany.mockResolvedValue([{ id: 1, name: "Spring 2026" }]);

    const res = await GET(req("http://localhost/api/mentor-semester"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, name: "Spring 2026" }]);
  });

  it("POST denies unauthorized users", async () => {
    const res = await POST(
      req("http://localhost/api/mentor-semester", "POST", {
        name: "Spring 2026",
      })
    );
    expect(res.status).toBe(403);
  });

  it("POST creates semester using existing active schedule", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });
    mockScheduleFindFirst.mockResolvedValue({ id: 10 });
    mockSemesterCreate.mockResolvedValue({
      id: 2,
      name: "Spring 2026",
      scheduleId: 10,
    });

    const res = await POST(
      req("http://localhost/api/mentor-semester", "POST", {
        name: "Spring 2026",
      })
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: 2,
      name: "Spring 2026",
      scheduleId: 10,
    });
  });

  it("PUT requires semester id", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });

    const res = await PUT(
      req("http://localhost/api/mentor-semester", "PUT", { name: "Fall 2026" })
    );
    expect(res.status).toBe(400);
  });

  it("DELETE requires semester id", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: true,
      isPrimary: false,
    });

    const res = await DELETE(
      req("http://localhost/api/mentor-semester", "DELETE", {})
    );
    expect(res.status).toBe(400);
  });
});
