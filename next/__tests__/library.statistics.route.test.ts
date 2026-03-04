import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCopiesCount, mockTextbooksCount } = vi.hoisted(() => ({
  mockCopiesCount: vi.fn(),
  mockTextbooksCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    textbookCopies: {
      count: mockCopiesCount,
    },
    textbooks: {
      count: mockTextbooksCount,
    },
  },
}));

import { GET } from "@/app/api/library/statistics/route";

describe("/api/library/statistics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns aggregate library metrics", async () => {
    mockCopiesCount.mockResolvedValueOnce(20).mockResolvedValueOnce(7);
    mockTextbooksCount.mockResolvedValue(9);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      totalBooks: 20,
      checkedOutBooks: 7,
      totalTextbooks: 9,
    });
  });

  it("returns 500 when count query fails", async () => {
    mockCopiesCount.mockRejectedValue(new Error("db fail"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
