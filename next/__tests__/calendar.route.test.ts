import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetToken } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
}));

vi.mock("@/lib/calendar", () => ({
  getToken: mockGetToken,
}));

import { DELETE, GET, POST, PUT } from "@/app/api/calendar/route";

describe("/api/calendar route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue("token");
  });

  it("GET proxies to Google Calendar API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const req = new Request("http://localhost/api/calendar") as any;
    const res = await GET(req);
    expect(fetchMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("POST returns 422 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/calendar", {
      method: "POST",
      body: "{",
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("POST returns 422 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({ summary: "x" }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("PUT returns 422 when id is missing", async () => {
    const req = new Request("http://localhost/api/calendar", {
      method: "PUT",
      body: JSON.stringify({
        summary: "x",
        description: "d",
        location: "l",
        start: "2026-01-01T10:00:00Z",
        end: "2026-01-01T11:00:00Z",
      }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("DELETE returns 422 when id is missing", async () => {
    const req = new Request("http://localhost/api/calendar", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await DELETE(req);
    expect(res.status).toBe(422);
  });
});
