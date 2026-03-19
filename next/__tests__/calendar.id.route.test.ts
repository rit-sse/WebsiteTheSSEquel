import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetToken } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
}));

vi.mock("@/lib/calendar", () => ({
  getToken: mockGetToken,
}));

import { GET } from "@/app/api/calendar/[id]/route";

describe("/api/calendar/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue("token");
  });

  it("proxies event fetch by id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"id":"evt-1"}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/api/calendar/evt-1") as any;
    const res = await GET(req, { params: Promise.resolve({ id: "evt-1" }) });

    expect(fetchMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
