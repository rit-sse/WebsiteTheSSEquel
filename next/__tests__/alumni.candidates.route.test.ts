import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockFormatAcademicTerm,
  mockUserFindFirst,
  mockCandidateFindMany,
  mockTransaction,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockFormatAcademicTerm: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockCandidateFindMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/academicTerm", () => ({
  formatAcademicTerm: mockFormatAcademicTerm,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockUserFindFirst,
    },
    alumniCandidate: {
      findMany: mockCandidateFindMany,
    },
    $transaction: mockTransaction,
  },
}));

import { GET, PUT } from "@/app/api/alumni-candidates/route";

describe("/api/alumni-candidates route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatAcademicTerm.mockReturnValue("Spring 2026");
  });

  it("GET returns 401 when user is not an officer", async () => {
    mockGetSessionToken.mockReturnValue(null);

    const req = {
      nextUrl: new URL("http://localhost/api/alumni-candidates"),
    } as any;
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("GET returns candidates for officers", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 1, email: "officer@g.rit.edu" });
    mockCandidateFindMany.mockResolvedValue([{ id: 2, status: "pending" }]);

    const req = {
      nextUrl: new URL("http://localhost/api/alumni-candidates?status=pending"),
    } as any;

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 2, status: "pending" }]);
  });

  it("PUT validates required id/status", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 1, email: "officer@g.rit.edu" });

    const req = new Request("http://localhost/api/alumni-candidates", {
      method: "PUT",
      body: JSON.stringify({ status: "approved" }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("PUT returns 404 when candidate does not exist", async () => {
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 1, email: "officer@g.rit.edu" });
    mockTransaction.mockImplementation(async (cb: any) => {
      const tx = {
        alumniCandidate: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };
      return cb(tx);
    });

    const req = new Request("http://localhost/api/alumni-candidates", {
      method: "PUT",
      body: JSON.stringify({ id: 123, status: "approved" }),
      headers: { "content-type": "application/json" },
    }) as any;

    const res = await PUT(req);
    expect(res.status).toBe(404);
  });
});
