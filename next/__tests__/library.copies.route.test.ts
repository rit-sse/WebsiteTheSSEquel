import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetAuth,
  mockGetSessionCookie,
  mockFindMany,
  mockCreate,
  mockUpdate,
} = vi.hoisted(() => ({
  mockGetAuth: vi.fn(),
  mockGetSessionCookie: vi.fn(),
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/app/api/library/authTools", () => ({
  getAuth: mockGetAuth,
  getSessionCookie: mockGetSessionCookie,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    textbookCopies: {
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
    },
  },
}));

import { GET, POST, PUT } from "@/app/api/library/copies/route";

function req(url: string, body?: unknown) {
  return {
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue(body ?? {}),
    cookies: {
      get: vi.fn(),
    },
  } as any;
}

describe("/api/library/copies route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockResolvedValue({ isOfficer: false, isMentor: false });
  });

  it("GET denies unauthorized users", async () => {
    const res = await GET(req("http://localhost/api/library/copies?isbn=123"));
    expect(res.status).toBe(401);
  });

  it("GET requires isbn or id when authorized", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });

    const res = await GET(req("http://localhost/api/library/copies"));
    expect(res.status).toBe(400);
  });

  it("POST denies request when session cookie is missing", async () => {
    const request = req("http://localhost/api/library/copies", { ISBN: "123" });
    request.cookies.get.mockReturnValue(undefined);

    const res = await POST(request);
    expect(res.status).toBe(401);
  });

  it("PUT updates copy when authorized", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });
    mockUpdate.mockResolvedValue({ id: 9, checkedOut: true });

    const res = await PUT(
      req("http://localhost/api/library/copies", { id: 9, checkedOut: true })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 9, checkedOut: true });
  });
});
