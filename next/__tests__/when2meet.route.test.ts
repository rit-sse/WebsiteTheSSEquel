import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

import { POST } from "@/app/api/when2meet/route";

describe("/api/when2meet route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("returns 400 when url is missing", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid when2meet url", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({ url: "https://example.com" }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when upstream fetch fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: "Bad Gateway" });

    const req = {
      json: vi.fn().mockResolvedValue({ url: "https://www.when2meet.com/?123-ABC" }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});
