import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockResolveAuthLevelFromRequest, mockGetSignedUploadUrl } = vi.hoisted(
  () => ({
    mockResolveAuthLevelFromRequest: vi.fn(),
    mockGetSignedUploadUrl: vi.fn(),
  })
);

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    getSignedUploadUrl: mockGetSignedUploadUrl,
  },
}));

import { POST } from "@/app/api/photos/uploads/route";

function req(body: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

describe("/api/photos/uploads route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: true,
      isSeAdmin: false,
    });
    mockGetSignedUploadUrl.mockResolvedValue("https://signed.example");
  });

  it("requires officer auth", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isSeAdmin: false,
    });

    const res = await POST(req({ files: [] }));
    expect(res.status).toBe(401);
  });

  it("rejects over-limit batches", async () => {
    const files = Array.from({ length: 501 }, (_, index) => ({
      clientId: String(index),
      filename: `${index}.jpg`,
      originalContentType: "image/jpeg",
      originalSizeBytes: 10,
      galleryContentType: "image/webp",
      gallerySizeBytes: 10,
    }));

    const res = await POST(req({ files }));
    expect(res.status).toBe(400);
  });

  it("rejects SVG uploads", async () => {
    const res = await POST(
      req({
        files: [
          {
            clientId: "a",
            filename: "bad.svg",
            originalContentType: "image/svg+xml",
            originalSizeBytes: 10,
            galleryContentType: "image/webp",
            gallerySizeBytes: 10,
          },
        ],
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns presigned URLs for original and gallery objects", async () => {
    const res = await POST(
      req({
        files: [
          {
            clientId: "a",
            filename: "photo.jpg",
            originalContentType: "image/jpeg",
            originalSizeBytes: 10,
            galleryContentType: "image/webp",
            gallerySizeBytes: 10,
          },
        ],
      })
    );

    expect(res.status).toBe(200);
    expect(mockGetSignedUploadUrl).toHaveBeenCalledTimes(2);
    expect(mockGetSignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/photos\/originals\/\d{4}\//),
      "image/jpeg",
      600
    );
    expect(mockGetSignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/photos\/gallery\/\d{4}\//),
      "image/webp",
      600
    );

    const body = await res.json();
    expect(body.uploads[0]).toMatchObject({
      clientId: "a",
      originalUploadUrl: "https://signed.example",
      galleryUploadUrl: "https://signed.example",
    });
  });
});
