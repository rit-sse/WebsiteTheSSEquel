import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetAuth, mockGetSessionCookie, mockFetch } = vi.hoisted(() => ({
  mockGetAuth: vi.fn(),
  mockGetSessionCookie: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("@/app/api/library/authTools", () => ({
  getAuth: mockGetAuth,
  getSessionCookie: mockGetSessionCookie,
}));

import { GET } from "@/app/api/library/isbnlookup/route";

function req(url: string) {
  return { nextUrl: new URL(url) } as any;
}

describe("/api/library/isbnlookup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockResolvedValue({ isMentor: false, isOfficer: false });
    vi.stubGlobal("fetch", mockFetch);
  });

  it("denies unauthorized users", async () => {
    const res = await GET(
      req("http://localhost/api/library/isbnlookup?isbn=123")
    );
    expect(res.status).toBe(401);
  });

  it("validates isbn query", async () => {
    mockGetAuth.mockResolvedValue({ isMentor: true, isOfficer: false });

    const res = await GET(req("http://localhost/api/library/isbnlookup"));
    expect(res.status).toBe(400);
  });

  it("returns transformed data from openlibrary", async () => {
    mockGetAuth.mockResolvedValue({ isMentor: true, isOfficer: false });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Book",
        subtitle: "Sub",
        description: { value: "Desc" },
        publishers: ["Pub"],
        publish_date: "2020-01-01",
      }),
    });

    const res = await GET(
      req("http://localhost/api/library/isbnlookup?isbn=123")
    );
    expect(res.status).toBe(200);
    const expectedYear = new Date("2020-01-01").getFullYear();
    expect(await res.json()).toMatchObject({
      ISBN: "123",
      name: "Book: Sub",
      description: "Desc",
      publisher: "Pub",
      yearPublished: expectedYear,
    });
  });
});
