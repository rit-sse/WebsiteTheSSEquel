import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPhotoFindMany, mockResolveAuthLevelFromRequest } = vi.hoisted(
  () => ({
    mockPhotoFindMany: vi.fn(),
    mockResolveAuthLevelFromRequest: vi.fn(),
  })
);

vi.mock("@/lib/prisma", () => ({
  default: {
    photo: {
      findMany: mockPhotoFindMany,
    },
  },
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

import { GET } from "@/app/api/photos/route";

function req(url = "http://localhost/api/photos") {
  return { nextUrl: new URL(url) } as any;
}

describe("/api/photos route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPhotoFindMany.mockResolvedValue([
      photo(2, new Date("2026-02-01T00:00:00Z")),
      photo(1, new Date("2026-01-01T00:00:00Z")),
    ]);
  });

  it("returns only published photos by default", async () => {
    const res = await GET(req());

    expect(res.status).toBe(200);
    expect(mockPhotoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "published" },
        orderBy: [{ sortDate: "desc" }, { id: "desc" }],
      })
    );
  });

  it("sorts newest first and returns proxied image URLs", async () => {
    const res = await GET(req());
    const body = await res.json();

    expect(body.photos.map((p: any) => p.id)).toEqual([2, 1]);
    expect(body.photos[0].imageUrl).toBe(
      "/api/aws/image?key=uploads%2Fphotos%2Fgallery%2F2.webp"
    );
  });

  it("requires officer auth for admin listing", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isSeAdmin: false,
    });

    const res = await GET(req("http://localhost/api/photos?admin=true"));
    expect(res.status).toBe(401);
  });

  it("applies year, event, category, and search filters", async () => {
    await GET(
      req(
        "http://localhost/api/photos?year=2026&eventId=e1&category=events&q=pic"
      )
    );

    expect(mockPhotoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "published",
          eventId: "e1",
          category: "events",
          sortDate: expect.objectContaining({
            gte: new Date("2026-01-01T00:00:00.000Z"),
            lt: new Date("2027-01-01T00:00:00.000Z"),
          }),
          OR: expect.any(Array),
        }),
      })
    );
  });
});

function photo(id: number, sortDate: Date) {
  return {
    id,
    galleryKey: `uploads/photos/gallery/${id}.webp`,
    caption: null,
    altText: null,
    category: "general",
    event: null,
    uploadedBy: null,
    exifTakenAt: null,
    manualTakenAt: null,
    uploadedAt: sortDate,
    sortDate,
    status: "published",
    originalFilename: `${id}.jpg`,
  };
}
