import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockGetGatewayAuthLevel,
  mockUserFindFirst,
  mockEventFindUnique,
  mockAttendanceFindMany,
  mockAttendanceFindUnique,
  mockAttendanceDelete,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockGetGatewayAuthLevel: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockEventFindUnique: vi.fn(),
  mockAttendanceFindMany: vi.fn(),
  mockAttendanceFindUnique: vi.fn(),
  mockAttendanceDelete: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockUserFindFirst,
    },
    event: {
      findUnique: mockEventFindUnique,
    },
    eventAttendance: {
      findMany: mockAttendanceFindMany,
      findUnique: mockAttendanceFindUnique,
      delete: mockAttendanceDelete,
    },
    memberships: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    purchaseRequest: {
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => cb({
      eventAttendance: { create: vi.fn() },
      memberships: { findFirst: vi.fn(), create: vi.fn() },
    })),
  },
}));

import { DELETE, GET, POST } from "@/app/api/event/[id]/attendance/route";

describe("/api/event/[id]/attendance route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 1, name: "User", email: "u@g.rit.edu", officers: [] });
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: false });
  });

  it("GET returns 404 when event does not exist", async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const res = await GET({} as any, { params: Promise.resolve({ id: "evt-1" }) });
    expect(res.status).toBe(404);
  });

  it("POST returns 401 when user is unauthenticated", async () => {
    mockGetSessionToken.mockReturnValue(null);

    const res = await POST({} as any, { params: Promise.resolve({ id: "evt-1" }) });
    expect(res.status).toBe(401);
  });

  it("DELETE forbids non-officer removing another user attendance", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({ userId: 42 }),
    } as any;

    const res = await DELETE(req, { params: Promise.resolve({ id: "evt-1" }) });
    expect(res.status).toBe(403);
  });
});
