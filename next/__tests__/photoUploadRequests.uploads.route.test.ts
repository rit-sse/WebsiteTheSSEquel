import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSignedUploadUrl } = vi.hoisted(() => ({
  mockGetSignedUploadUrl: vi.fn(),
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    getSignedUploadUrl: mockGetSignedUploadUrl,
  },
}));

import { POST } from "@/app/api/photo-upload-requests/uploads/route";

function req(body: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

describe("/api/photo-upload-requests/uploads route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSignedUploadUrl.mockResolvedValue("https://signed.example");
  });

  it("does not require auth and returns request-prefixed upload URLs", async () => {
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
      }),
    );

    expect(res.status).toBe(200);
    expect(mockGetSignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/photos\/requests\/originals\/\d{4}\//),
      "image/jpeg",
      600,
    );
    expect(mockGetSignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/photos\/requests\/gallery\/\d{4}\//),
      "image/webp",
      600,
    );

    const body = await res.json();
    expect(body.requestToken).toMatch(new RegExp(`^${body.batchId}\\.`));
    expect(body.uploads[0]).toMatchObject({
      clientId: "a",
      originalUploadUrl: "https://signed.example",
      galleryUploadUrl: "https://signed.example",
    });
  });

  it("rejects over-limit batches", async () => {
    const files = Array.from({ length: 21 }, (_, index) => ({
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
      }),
    );

    expect(res.status).toBe(400);
  });
});
