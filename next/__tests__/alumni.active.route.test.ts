import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockGetImageUrl } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockGetImageUrl: vi.fn(),
}));

vi.mock("@/lib/s3Utils", () => ({
  getImageUrl: mockGetImageUrl,
  resolveUserImage: vi.fn(),
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    alumni: {
      findMany: mockFindMany,
    },
  },
}));

import { GET } from "@/app/api/alumni/[active]/route";

describe("/api/alumni/[active] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetImageUrl.mockReturnValue("resolved-image");
  });

  it("GET returns alumni list with image mapping", async () => {
    mockFindMany.mockResolvedValue([{ id: 1, name: "Alum", image: "key" }]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 1, name: "Alum", image: "resolved-image", imageKey: "key" },
    ]);
  });

  it("GET returns 500 if query fails", async () => {
    mockFindMany.mockRejectedValue(new Error("db fail"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
