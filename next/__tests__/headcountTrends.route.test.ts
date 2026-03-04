import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockMentorHeadcountFindMany,
  mockMenteeHeadcountFindMany,
  mockMentorSemesterFindMany,
  mockParseAcademicTermLabel,
} = vi.hoisted(() => ({
  mockMentorHeadcountFindMany: vi.fn(),
  mockMenteeHeadcountFindMany: vi.fn(),
  mockMentorSemesterFindMany: vi.fn(),
  mockParseAcademicTermLabel: vi.fn(),
}));

vi.mock("@/lib/academicTerm", () => ({
  parseAcademicTermLabel: mockParseAcademicTermLabel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    mentorHeadcountEntry: {
      findMany: mockMentorHeadcountFindMany,
    },
    menteeHeadcountEntry: {
      findMany: mockMenteeHeadcountFindMany,
    },
    mentorSemester: {
      findMany: mockMentorSemesterFindMany,
    },
  },
}));

import { GET } from "@/app/api/headcount-trends/route";

describe("/api/headcount-trends route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseAcademicTermLabel.mockImplementation((label: string) => {
      if (label === "Spring 2026") return { term: "SPRING", year: 2026 };
      if (label === "Fall 2026") return { term: "FALL", year: 2026 };
      return null;
    });
  });

  it("aggregates mentor and mentee headcount by semester", async () => {
    mockMentorHeadcountFindMany.mockResolvedValue([
      { semesterId: 1, peopleInLab: 5, semester: { id: 1, name: "Spring 2026" } },
      { semesterId: 1, peopleInLab: 7, semester: { id: 1, name: "Spring 2026" } },
    ]);
    mockMenteeHeadcountFindMany.mockResolvedValue([
      {
        semesterId: 1,
        studentsMentoredCount: 10,
        testsCheckedOutCount: 4,
        semester: { id: 1, name: "Spring 2026" },
      },
      {
        semesterId: 1,
        studentsMentoredCount: 6,
        testsCheckedOutCount: 2,
        semester: { id: 1, name: "Spring 2026" },
      },
    ]);
    mockMentorSemesterFindMany.mockResolvedValue([
      {
        id: 1,
        name: "Spring 2026",
        isActive: true,
        semesterStart: new Date("2026-01-15T00:00:00.000Z"),
        semesterEnd: new Date("2026-05-01T00:00:00.000Z"),
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      semesterId: 1,
      semesterName: "Spring 2026",
      mentorSubmissions: 2,
      avgPeopleInLab: 6,
      menteeSubmissions: 2,
      avgStudentsMentored: 8,
      totalStudentsMentored: 16,
      avgTestsCheckedOut: 3,
      totalTestsCheckedOut: 6,
      isActive: true,
    });
  });

  it("includes unassigned data as a separate trend", async () => {
    mockMentorHeadcountFindMany.mockResolvedValue([
      { semesterId: null, peopleInLab: 3, semester: null },
    ]);
    mockMenteeHeadcountFindMany.mockResolvedValue([]);
    mockMentorSemesterFindMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      semesterId: null,
      semesterName: "Unassigned",
      mentorSubmissions: 1,
      avgPeopleInLab: 3,
      menteeSubmissions: 0,
    });
  });
});
