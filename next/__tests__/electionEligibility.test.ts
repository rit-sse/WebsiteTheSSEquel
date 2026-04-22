import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockMembershipCount, mockUserFindMany, mockGetCurrentAcademicTerm, mockGetAcademicTermDateRange } =
  vi.hoisted(() => ({
    mockMembershipCount: vi.fn(),
    mockUserFindMany: vi.fn(),
    mockGetCurrentAcademicTerm: vi.fn(),
    mockGetAcademicTermDateRange: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  default: {
    memberships: {
      count: mockMembershipCount,
    },
    user: {
      findMany: mockUserFindMany,
    },
  },
}));

vi.mock("@/lib/academicTerm", () => ({
  getCurrentAcademicTerm: mockGetCurrentAcademicTerm,
  getAcademicTermDateRange: mockGetAcademicTermDateRange,
}));

import {
  isActiveMemberForElection,
  listEligibleElectionVoters,
} from "@/lib/electionEligibility";

describe("election eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentAcademicTerm.mockReturnValue({ term: "SPRING", year: 2026 });
    mockGetAcademicTermDateRange.mockImplementation((term: string, year: number) => {
      if (term === "SPRING" && year === 2026) {
        return {
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: new Date("2026-05-31T23:59:59.999Z"),
        };
      }
      return {
        startDate: new Date("2025-08-01T00:00:00.000Z"),
        endDate: new Date("2025-12-31T23:59:59.999Z"),
      };
    });
  });

  it("checks current-term memberships outside the grace period", async () => {
    mockMembershipCount.mockResolvedValue(1);

    await isActiveMemberForElection(7, new Date("2026-02-20T12:00:00.000Z"));

    // New shape: filter by the explicit (term, year) columns rather than
    // a `dateGiven` range.
    expect(mockMembershipCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 7,
          OR: [{ term: "SPRING", year: 2026 }],
        }),
      })
    );
  });

  it("includes the previous term during the first 14 days of a term", async () => {
    mockMembershipCount.mockResolvedValue(1);
    mockUserFindMany.mockResolvedValue([{ id: 1, name: "A", email: "a@example.com" }]);

    await isActiveMemberForElection(7, new Date("2026-01-05T12:00:00.000Z"));
    await listEligibleElectionVoters(new Date("2026-01-05T12:00:00.000Z"));

    expect(mockMembershipCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { term: "FALL", year: 2025 },
          ]),
        }),
      })
    );
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          Memberships: expect.objectContaining({
            some: expect.objectContaining({
              OR: expect.arrayContaining([
                { term: "FALL", year: 2025 },
              ]),
            }),
          }),
        }),
      })
    );
  });
});

