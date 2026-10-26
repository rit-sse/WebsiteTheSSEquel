import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  default: { officerPosition: { findMany: mockFindMany } },
}));

import {
  listCommitteeHeadPositions,
  validateCommitteeHeadPositionIds,
} from "@/lib/committeeHeadNominations";
import { TECH_COMMITTEE_DIVISION_MANAGER_TITLES } from "@/lib/utils";

describe("committee head nomination positions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
  });

  it("excludes Tech Committee Division Managers from the nomination list", async () => {
    await listCommitteeHeadPositions();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: "COMMITTEE_HEAD",
          is_defunct: false,
          title: { notIn: [...TECH_COMMITTEE_DIVISION_MANAGER_TITLES] },
        }),
      })
    );
  });

  it("rejects a Division Manager position id on submission", async () => {
    // The excluded position is filtered out by the query, so the count mismatches.
    mockFindMany.mockResolvedValue([{ id: 1, title: "Events Head" }]);

    const result = await validateCommitteeHeadPositionIds([1, 2]);

    expect(result.ok).toBe(false);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: [1, 2] },
          title: { notIn: [...TECH_COMMITTEE_DIVISION_MANAGER_TITLES] },
        }),
      })
    );
  });
});
