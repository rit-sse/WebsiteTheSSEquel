import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

vi.mock("@/lib/S3Client", () => ({
  getS3Client: () => ({ send: mockSend }),
  getBucketName: () => "test-bucket",
}));

import { GET } from "@/app/api/aws/image/route";

function req(url: string) {
  return { nextUrl: new URL(url) } as any;
}

describe("/api/aws/image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires key query param", async () => {
    const res = await GET(req("http://localhost/api/aws/image"));
    expect(res.status).toBe(400);
  });

  it("rejects non-uploads keys", async () => {
    const res = await GET(
      req("http://localhost/api/aws/image?key=bad/key.jpg")
    );
    expect(res.status).toBe(403);
  });

  it("proxies image when S3 fetch succeeds", async () => {
    mockSend.mockResolvedValue({
      Body: { transformToByteArray: () => new Uint8Array([1, 2, 3]) },
      ContentType: "image/jpeg",
    });

    const res = await GET(
      req("http://localhost/api/aws/image?key=uploads/a.jpg")
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("cache-control")).toBe(
      "public, max-age=300, stale-while-revalidate=600"
    );
  });

  it("serves immutable cache headers for photo gallery keys", async () => {
    mockSend.mockResolvedValue({
      Body: { transformToByteArray: () => new Uint8Array([1, 2, 3]) },
      ContentType: "image/webp",
    });

    const res = await GET(
      req(
        "http://localhost/api/aws/image?key=uploads/photos/gallery/2026/batch/a.webp"
      )
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  it("allows library asset keys", async () => {
    mockSend.mockResolvedValue({
      Body: { transformToByteArray: () => new Uint8Array([1, 2, 3]) },
      ContentType: "image/jpeg",
    });

    const res = await GET(
      req(
        "http://localhost/api/aws/image?key=assets/library/9781556159008/cover.jpg"
      )
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
  });

  it("returns 404 for missing S3 key", async () => {
    const err = new Error("not found");
    err.name = "NoSuchKey";
    mockSend.mockRejectedValue(err);

    const res = await GET(
      req("http://localhost/api/aws/image?key=uploads/missing.jpg")
    );
    expect(res.status).toBe(404);
  });
});
