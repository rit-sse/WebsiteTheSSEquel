import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockGetGatewayAuthLevel,
  mockUserFindFirst,
  mockEventFindUnique,
  mockAttendanceCreate,
  mockAttendanceFindUnique,
  mockAttendanceDelete,
  mockMembershipFindFirst,
  mockMembershipCreate,
  mockMembershipDeleteMany,
  mockTxAttendanceFindMany,
  mockTxAttendanceCreate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockGetGatewayAuthLevel: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockEventFindUnique: vi.fn(),
  mockAttendanceCreate: vi.fn(),
  mockAttendanceFindUnique: vi.fn(),
  mockAttendanceDelete: vi.fn(),
  mockMembershipFindFirst: vi.fn(),
  mockMembershipCreate: vi.fn(),
  mockMembershipDeleteMany: vi.fn(),
  mockTxAttendanceFindMany: vi.fn(),
  mockTxAttendanceCreate: vi.fn(),
  mockTransaction: vi.fn(),
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
      findUnique: mockAttendanceFindUnique,
      create: mockAttendanceCreate,
      delete: mockAttendanceDelete,
    },
    memberships: {
      findFirst: mockMembershipFindFirst,
      create: mockMembershipCreate,
      deleteMany: mockMembershipDeleteMany,
    },
    purchaseRequest: {
      update: vi.fn(),
    },
    $transaction: mockTransaction,
  },
}));

import { DELETE, GET, POST } from "@/app/api/event/[id]/attendance/route";

describe("/api/event/[id]/attendance route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) =>
      cb({
        eventAttendance: {
          create: mockTxAttendanceCreate,
          findMany: mockTxAttendanceFindMany,
          delete: mockAttendanceDelete,
        },
        memberships: {
          findFirst: mockMembershipFindFirst,
          create: mockMembershipCreate,
          deleteMany: mockMembershipDeleteMany,
        },
      })
    );
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({
      id: 1,
      name: "User",
      email: "u@g.rit.edu",
      officers: [],
    });
    mockGetGatewayAuthLevel.mockResolvedValue({ isOfficer: false });
    mockTxAttendanceCreate.mockResolvedValue({
      id: 11,
      eventId: "evt-1",
      userId: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    mockTxAttendanceFindMany.mockResolvedValue([]);
    mockMembershipFindFirst.mockResolvedValue(null);
    mockMembershipCreate.mockResolvedValue({
      id: 1,
      userId: 1,
      reason: "Attended event: Event [evt-1]",
      dateGiven: "2026-01-01T00:00:00.000Z",
    });
    mockAttendanceFindUnique.mockResolvedValue(null);
  });

  it("GET returns 404 when event does not exist", async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const res = await GET({} as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("GET reconciles memberships for ended grants-membership event", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      date: "2026-01-01T00:00:00.000Z",
      attendanceEnabled: true,
      grantsMembership: true,
    });
    mockTxAttendanceFindMany
      .mockResolvedValueOnce([{ userId: 1 }])
      .mockResolvedValueOnce([
        {
          id: 11,
          user: { id: 1, name: "User", email: "u@g.rit.edu" },
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ]);

    const res = await GET({} as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    expect(res.status).toBe(200);
    expect(mockMembershipCreate).toHaveBeenCalledTimes(1);
  });

  it("POST returns 401 when user is unauthenticated", async () => {
    mockGetSessionToken.mockReturnValue(null);

    const res = await POST({} as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST blocks early check-ins before T-15m", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      date: "2100-01-01T00:00:00.000Z",
      attendanceEnabled: true,
      grantsMembership: true,
      purchaseRequests: [],
    });

    const res = await POST({} as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.earlyCheckin).toBe(true);
    expect(mockTxAttendanceCreate).not.toHaveBeenCalled();
  });

  it("POST creates attendance and returns membershipPending before event end", async () => {
    const upcomingDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      date: upcomingDate,
      attendanceEnabled: true,
      grantsMembership: true,
      purchaseRequests: [],
    });

    const res = await POST({} as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.membershipPending).toBe(true);
    expect(body.membershipGranted).toBe(false);
    expect(mockTxAttendanceCreate).toHaveBeenCalledTimes(1);
    expect(mockMembershipCreate).not.toHaveBeenCalled();
  });

  it("POST creates membership after event end", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      date: "2020-01-01T00:00:00.000Z",
      attendanceEnabled: true,
      grantsMembership: true,
      purchaseRequests: [],
    });
    mockTxAttendanceFindMany.mockResolvedValue([{ userId: 1 }]);
    mockMembershipFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 1,
      userId: 1,
      reason: "Attended event: Event [evt-1]",
    });

    const res = await POST({} as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.membershipPending).toBe(false);
    expect(body.membershipGranted).toBe(true);
    expect(mockMembershipCreate).toHaveBeenCalledTimes(1);
  });

  it("POST 409 returns membershipPending before event end", async () => {
    const upcomingDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      date: upcomingDate,
      attendanceEnabled: true,
      grantsMembership: true,
      purchaseRequests: [],
    });
    mockAttendanceFindUnique.mockResolvedValue({
      id: 99,
      eventId: "evt-1",
      userId: 1,
    });

    const res = await POST({} as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.membershipPending).toBe(true);
    expect(mockMembershipCreate).not.toHaveBeenCalled();
  });

  it("POST 409 backfills membership after event end", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      date: "2020-01-01T00:00:00.000Z",
      attendanceEnabled: true,
      grantsMembership: true,
      purchaseRequests: [],
    });
    mockAttendanceFindUnique.mockResolvedValue({
      id: 99,
      eventId: "evt-1",
      userId: 1,
    });
    mockTxAttendanceFindMany.mockResolvedValue([{ userId: 1 }]);
    mockMembershipFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 1,
      userId: 1,
      reason: "Attended event: Event [evt-1]",
    });

    const res = await POST({} as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.membershipGranted).toBe(true);
    expect(body.membershipPending).toBe(false);
    expect(mockMembershipCreate).toHaveBeenCalledTimes(1);
  });

  it("DELETE forbids non-officer removing another user attendance", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({ userId: 42 }),
    } as any;

    const res = await DELETE(req, { params: Promise.resolve({ id: "evt-1" }) });
    expect(res.status).toBe(403);
  });

  it("DELETE removes attendance and linked event memberships", async () => {
    mockAttendanceFindUnique.mockResolvedValue({
      id: 99,
      eventId: "evt-1",
      userId: 1,
    });

    const req = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const res = await DELETE(req, { params: Promise.resolve({ id: "evt-1" }) });
    expect(res.status).toBe(200);
    expect(mockAttendanceDelete).toHaveBeenCalledWith({ where: { id: 99 } });
    expect(mockMembershipDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
        reason: {
          contains: "[evt-1]",
        },
      },
    });
  });
});
