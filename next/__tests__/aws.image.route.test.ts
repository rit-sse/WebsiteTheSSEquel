import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetPublicS3Url, mockFetch } = vi.hoisted(() => ({
  mockGetPublicS3Url: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("@/lib/s3Utils", () => ({
  getPublicS3Url: mockGetPublicS3Url,
  resolveUserImage: vi.fn(),
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

import { GET } from "@/app/api/aws/image/route";

function req(url: string) {
  return { nextUrl: new URL(url) } as any;
}

describe("/api/aws/image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("requires key query param", async () => {
    const res = await GET(req("http://localhost/api/aws/image"));
    expect(res.status).toBe(400);
  });

  it("rejects non-uploads keys", async () => {
    const res = await GET(req("http://localhost/api/aws/image?key=bad/key.jpg"));
    expect(res.status).toBe(403);
  });

  it("proxies image when upstream fetch succeeds", async () => {
    mockGetPublicS3Url.mockReturnValue("https://example.com/image.jpg");
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: new ReadableStream(),
      headers: { get: () => "image/jpeg" },
    });

    const res = await GET(req("http://localhost/api/aws/image?key=uploads/a.jpg"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
  });
});
