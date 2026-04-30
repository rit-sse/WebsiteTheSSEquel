import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockElectionCount,
  mockElectionFindFirst,
  mockElectionFindUnique,
  mockElectionCreate,
  mockElectionOfficeCreateMany,
  mockOfficerFindFirst,
  mockOfficerPositionFindMany,
  mockTransaction,
} = vi.hoisted(() => ({
  mockElectionCount: vi.fn(),
  mockElectionFindFirst: vi.fn(),
  mockElectionFindUnique: vi.fn(),
  mockElectionCreate: vi.fn(),
  mockElectionOfficeCreateMany: vi.fn(),
  mockOfficerFindFirst: vi.fn(),
  mockOfficerPositionFindMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    election: {
      count: mockElectionCount,
      findFirst: mockElectionFindFirst,
      findUnique: mockElectionFindUnique,
      create: mockElectionCreate,
    },
    electionOffice: {
      createMany: mockElectionOfficeCreateMany,
    },
    officer: {
      findFirst: mockOfficerFindFirst,
    },
    officerPosition: {
      findMany: mockOfficerPositionFindMany,
    },
    $transaction: mockTransaction,
  },
}));

import {
  shouldKickoffNewElection,
  kickoffElectionForCurrentTerm,
} from "@/lib/electionAutoKickoff";

describe("electionAutoKickoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElectionFindUnique.mockResolvedValue(null); // slug is unique by default
    mockTransaction.mockImplementation(async (fn) =>
      fn({
        election: {
          create: mockElectionCreate,
        },
        electionOffice: {
          createMany: mockElectionOfficeCreateMany,
        },
      })
    );
  });

  describe("shouldKickoffNewElection", () => {
    it("returns false when an in-flight election already exists", async () => {
      mockElectionCount.mockResolvedValue(1);
      const result = await shouldKickoffNewElection(
        new Date("2026-04-30T00:00:00Z")
      );
      expect(result).toBe(false);
      expect(mockElectionCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: expect.objectContaining({ in: expect.any(Array) }),
        }),
      });
    });

    it("returns true on bootstrap (no certified history) when nothing in flight", async () => {
      mockElectionCount.mockResolvedValue(0);
      mockElectionFindFirst.mockResolvedValue(null);
      const result = await shouldKickoffNewElection(
        new Date("2026-04-30T00:00:00Z")
      );
      expect(result).toBe(true);
    });

    it("returns false when last certified election is for the current term", async () => {
      mockElectionCount.mockResolvedValue(0);
      // certified mid-April 2026 (SPRING 2026)
      mockElectionFindFirst.mockResolvedValue({
        nominationsCloseAt: new Date("2026-04-15T00:00:00Z"),
        certifiedAt: new Date("2026-04-22T00:00:00Z"),
      });
      const result = await shouldKickoffNewElection(
        new Date("2026-04-30T00:00:00Z") // also SPRING 2026
      );
      expect(result).toBe(false);
    });

    it("returns true when last certified election is for a prior term", async () => {
      mockElectionCount.mockResolvedValue(0);
      // certified during FALL 2025 — and now we're in SPRING 2026
      mockElectionFindFirst.mockResolvedValue({
        nominationsCloseAt: new Date("2025-11-15T00:00:00Z"),
        certifiedAt: new Date("2025-11-22T00:00:00Z"),
      });
      const result = await shouldKickoffNewElection(
        new Date("2026-02-15T00:00:00Z") // SPRING 2026
      );
      expect(result).toBe(true);
    });
  });

  describe("kickoffElectionForCurrentTerm", () => {
    it("no-ops when shouldKickoffNewElection returns false", async () => {
      mockElectionCount.mockResolvedValue(1); // in-flight election exists
      const result = await kickoffElectionForCurrentTerm({
        atDate: new Date("2026-04-30T00:00:00Z"),
      });
      expect(result.created).toBe(false);
      expect(mockElectionCreate).not.toHaveBeenCalled();
      expect(mockElectionOfficeCreateMany).not.toHaveBeenCalled();
    });

    it("creates a new election + offices when conditions are met", async () => {
      mockElectionCount.mockResolvedValue(0);
      mockElectionFindFirst
        // last certified — prior term
        .mockResolvedValueOnce({
          nominationsCloseAt: new Date("2025-11-15T00:00:00Z"),
          certifiedAt: new Date("2025-11-22T00:00:00Z"),
        })
        // currently active President for actor lookup
        .mockResolvedValueOnce(null) // no active president
        // active SE office holder
        .mockResolvedValueOnce(null) // none either
        // last certifier as fallback
        .mockResolvedValueOnce({ certifiedById: 99 });
      // pickKickoffActor uses officer.findFirst, not election.findFirst —
      // mock those instead
      mockOfficerFindFirst
        .mockResolvedValueOnce({ user_id: 17 }) // active president found
        .mockResolvedValueOnce(null);

      mockOfficerPositionFindMany.mockResolvedValue([
        { id: 1, title: "President" },
        { id: 2, title: "Secretary" },
        { id: 3, title: "Treasurer" },
        { id: 4, title: "Mentoring Head" },
      ]);

      mockElectionCreate.mockResolvedValue({ id: 42, slug: "spring-2026-primary" });

      const result = await kickoffElectionForCurrentTerm({
        atDate: new Date("2026-02-15T00:00:00Z"),
      });

      expect(result.created).toBe(true);
      expect(result.electionId).toBe(42);
      expect(mockElectionCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockElectionCreate.mock.calls[0][0];
      expect(createArgs.data.title).toBe("Spring 2026 Primary Officer Election");
      expect(createArgs.data.slug).toBe("spring-2026-primary");
      expect(createArgs.data.status).toBe("NOMINATIONS_OPEN");
      expect(createArgs.data.createdById).toBe(17);

      // 4 office rows for the 4 primary positions returned
      expect(mockElectionOfficeCreateMany).toHaveBeenCalledTimes(1);
      expect(mockElectionOfficeCreateMany.mock.calls[0][0].data).toHaveLength(4);
    });

    it("returns a useful reason when no actor is available", async () => {
      mockElectionCount.mockResolvedValue(0);
      mockElectionFindFirst
        .mockResolvedValueOnce({
          nominationsCloseAt: new Date("2025-11-15T00:00:00Z"),
          certifiedAt: new Date("2025-11-22T00:00:00Z"),
        })
        .mockResolvedValueOnce(null); // no last certifier
      mockOfficerFindFirst.mockResolvedValue(null); // no active president, no SE office

      const result = await kickoffElectionForCurrentTerm({
        atDate: new Date("2026-02-15T00:00:00Z"),
      });
      expect(result.created).toBe(false);
      expect(result.reason).toMatch(/no eligible kickoff actor/i);
    });
  });
});
