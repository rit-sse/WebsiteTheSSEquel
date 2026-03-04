import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetGatewayAuthLevel, mockTransaction } = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: mockTransaction,
  },
}));

import { DELETE, POST } from "@/app/api/headcount-import/route";

describe("/api/headcount-import route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST denies non-manager users", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: false, isPrimary: false });
    const req = new Request("http://localhost/api/headcount-import", {
      method: "POST",
      body: JSON.stringify({ type: "mentor", rows: [] }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("POST validates payload shape", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });
    const req = new Request("http://localhost/api/headcount-import", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
      headers: { "content-type": "application/json" },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("DELETE denies non-manager users", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: false, isPrimary: false });
    const req = new Request("http://localhost/api/headcount-import", {
      method: "DELETE",
    }) as any;
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it("DELETE clears data and returns deleted counts", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({ isMentoringHead: true, isPrimary: false });

    mockTransaction.mockImplementation(async (cb: any) =>
      cb({
        mentorHeadcountMentor: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
        menteeHeadcountMentor: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
        menteeHeadcountCourse: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
        mentorHeadcountEntry: { deleteMany: vi.fn().mockResolvedValue({ count: 4 }) },
        menteeHeadcountEntry: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
      })
    );

    const req = new Request("http://localhost/api/headcount-import", {
      method: "DELETE",
    }) as any;
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.deleted).toEqual({
      mentorEntries: 4,
      menteeEntries: 5,
      joinRecords: 6,
    });
  });
});
