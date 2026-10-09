import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Papa from "papaparse";

const { mockAuth, mockFindMany, mockTransaction } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({ getGatewayAuthLevel: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  default: { $transaction: mockTransaction },
}));

import { GET } from "@/app/api/user/export/route";

const headers = ["user_id", "name", "email", "is_alumni", "date_created"];
const request = () => new Request("http://localhost/api/user/export");

function user(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    createdAt: null,
    graduationYear: null,
    alumni: null,
    ...overrides,
  };
}

describe("GET /api/user/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-08T14:30:00.123Z"));
    mockAuth.mockResolvedValue({
      isUser: true,
      isOfficer: true,
      isSeAdmin: false,
    });
    mockFindMany.mockResolvedValue([]);
    mockTransaction.mockImplementation((callback) =>
      callback({ user: { findMany: mockFindMany } })
    );
  });

  afterEach(() => vi.useRealTimers());

  it.each([
    [{ isUser: false, isOfficer: false, isSeAdmin: false }, 401],
    [{ isUser: true, isOfficer: false, isSeAdmin: false, isMentor: true }, 403],
  ])(
    "denies unauthorized callers before reading users: %j",
    async (auth, status) => {
      mockAuth.mockResolvedValue(auth);
      const response = await GET(request());
      expect(response.status).toBe(status);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockFindMany).not.toHaveBeenCalled();
      expect(await response.json()).toHaveProperty("error");
    }
  );

  it("allows SE Admin access consistent with officer middleware", async () => {
    mockAuth.mockResolvedValue({
      isUser: true,
      isOfficer: false,
      isSeAdmin: true,
    });
    expect((await GET(request())).status).toBe(200);
  });

  it("downloads one row per user with linked alumni and exact creation timestamps", async () => {
    mockFindMany.mockResolvedValue([
      user(1, {
        alumni: { id: 8 },
        createdAt: new Date("2026-10-08T14:30:00.123Z"),
      }),
      user(2, { isImported: true }),
      user(3, { alumniCandidates: [{ status: "pending" }] }),
    ]);

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/csv; charset=utf-8"
    );
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="sse-users-[\dTZ-]+\.csv"$/
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const parsed = Papa.parse<string[]>(await response.text());
    expect(parsed.errors).toEqual([]);
    expect(parsed.data).toEqual([
      headers,
      ["1", "User 1", "user1@example.com", "true", "2026-10-08T14:30:00.123Z"],
      ["2", "User 2", "user2@example.com", "false", ""],
      ["3", "User 3", "user3@example.com", "false", ""],
    ]);
  });

  it("exports all users despite caller pagination and search parameters", async () => {
    mockFindMany.mockResolvedValue(
      Array.from({ length: 105 }, (_, i) => user(i + 1))
    );
    const response = await GET(
      new Request(
        "http://localhost/api/user/export?search=not-found&page=3&limit=25"
      )
    );
    expect(Papa.parse(await response.text()).data).toHaveLength(106);
    expect(mockFindMany).toHaveBeenCalledExactlyOnceWith({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        graduationYear: true,
        alumni: { select: { id: true } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "RepeatableRead",
    });
  });

  it.each([
    [2025, "true"],
    [2026, "false"],
    [2027, "false"],
    [null, "false"],
  ])(
    "infers alumni without an application from graduation year %s",
    async (graduationYear, expected) => {
      mockFindMany.mockResolvedValue([user(1, { graduationYear })]);
      const response = await GET(request());
      const parsed = Papa.parse<string[]>(await response.text());
      expect(parsed.data[0]).toEqual(headers);
      expect(parsed.data[1][3]).toBe(expected);
    }
  );

  it("keeps linked alumni marked even with a future graduation year", async () => {
    mockFindMany.mockResolvedValue([
      user(1, { alumni: { id: 8 }, graduationYear: 2027 }),
    ]);
    const response = await GET(request());
    expect(Papa.parse<string[]>(await response.text()).data[1][3]).toBe("true");
  });

  it("uses the current year at export time across the UTC year boundary", async () => {
    mockFindMany.mockResolvedValue([user(1, { graduationYear: 2026 })]);
    vi.setSystemTime(new Date("2026-12-31T23:59:59.999Z"));
    const before = await GET(request());
    expect(Papa.parse<string[]>(await before.text()).data[1][3]).toBe("false");

    vi.setSystemTime(new Date("2027-01-01T00:00:00.000Z"));
    const after = await GET(request());
    expect(Papa.parse<string[]>(await after.text()).data[1][3]).toBe("true");
  });

  it("returns stable headers when there are no users", async () => {
    const response = await GET(request());
    expect(
      Papa.parse<string[]>(await response.text(), { skipEmptyLines: true }).data
    ).toEqual([headers]);
  });

  it("preserves Unicode, delimiters, quotes, and multiline names without exporting extra fields", async () => {
    const name = 'Zoë, "SSE"\nMember';
    mockFindMany.mockResolvedValue([
      user(4, { name, access_token: "private-token" }),
    ]);
    const response = await GET(request());
    const csv = await response.text();
    expect(Papa.parse<string[]>(csv).data[1]).toEqual([
      "4",
      name,
      "user4@example.com",
      "false",
      "",
    ]);
    expect(csv).not.toContain("private-token");
  });

  it.each(["=1+1", "+SUM(A1)", "-1+1", "@SUM(A1)", "\t=1+1", "\r=1+1"])(
    "escapes spreadsheet formulas in user-provided fields: %j",
    async (value) => {
      mockFindMany.mockResolvedValue([user(1, { name: value, email: value })]);
      const response = await GET(request());
      const row = Papa.parse<string[]>(await response.text()).data[1];
      expect(row[1]).toBe(`'${value}`);
      expect(row[2]).toBe(`'${value}`);
    }
  );

  it("returns an uncached error instead of an attachment when generation fails", async () => {
    mockFindMany.mockRejectedValue(new Error("private database details"));
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.has("Content-Disposition")).toBe(false);
    expect(await response.text()).not.toContain("private database details");
  });
});
