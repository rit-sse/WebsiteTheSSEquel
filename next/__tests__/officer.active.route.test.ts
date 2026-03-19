import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockResolveUserImage } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockResolveUserImage: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    officer: {
      findMany: mockFindMany,
    },
  },
}));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

import { GET } from "@/app/api/officer/[active]/route";

describe("/api/officer/[active] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
  });

  it("returns active officers with resolved image field", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 1,
        user: {
          id: 20,
          name: "Officer",
          email: "officer@g.rit.edu",
          profileImageKey: null,
          googleImageURL: null,
          linkedIn: null,
          gitHub: null,
          description: null,
        },
        position: { is_primary: true, title: "President" },
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body[0]).toMatchObject({
      id: 1,
      user: {
        id: 20,
        image: "resolved-image",
      },
      position: { title: "President" },
    });
  });
});
