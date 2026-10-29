import { beforeEach, describe, expect, it, vi } from "vitest";
import { MANUAL_MEMBERSHIP_REASONS } from "@/lib/membershipUtils";

const {
  mockMembershipsGroupBy,
  mockUserFindMany,
  mockMembershipsCreate,
  mockResolveUserImage,
  mockGetCurrentSseOperationalTerm,
  mockAuth,
  mockUserFindUnique,
  mockCreateAward,
  mockSendAwardEmail,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockCreateAward: vi.fn(),
  mockSendAwardEmail: vi.fn(),
  mockMembershipsGroupBy: vi.fn(),
  mockUserFindMany: vi.fn(),
  mockMembershipsCreate: vi.fn(),
  mockResolveUserImage: vi.fn(),
  mockGetCurrentSseOperationalTerm: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    memberships: {
      groupBy: mockMembershipsGroupBy,
      create: mockMembershipsCreate,
    },
    user: {
      findMany: mockUserFindMany,
      findUnique: mockUserFindUnique,
    },
  },
}));

vi.mock("@/lib/authGateway", () => ({ getGatewayAuthLevel: mockAuth }));
vi.mock("@/lib/baseUrl", () => ({
  getPublicBaseUrl: () => "https://sse.example",
}));
vi.mock("@/lib/services/membershipAwardService", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/services/membershipAwardService")
    >();
  return {
    ...actual,
    createEmailMembershipAward: mockCreateAward,
    sendMembershipAwardEmail: mockSendAwardEmail,
  };
});

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

vi.mock("@/lib/sseTerms", () => ({
  getCurrentSseOperationalTerm: mockGetCurrentSseOperationalTerm,
}));

import { GET, POST } from "@/app/api/memberships/route";

describe("/api/memberships route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 1, isOfficer: true });
    mockUserFindUnique.mockResolvedValue({ id: 15 });
    mockResolveUserImage.mockReturnValue("resolved-image");
    mockGetCurrentSseOperationalTerm.mockReturnValue({
      term: "SPRING",
      year: 2026,
    });
  });

  it("GET aggregates memberships per user for the active SSE term", async () => {
    mockMembershipsGroupBy.mockResolvedValue([
      {
        userId: 10,
        _count: { userId: 2 },
        _max: { dateGiven: "2026-01-01T00:00:00.000Z" },
      },
    ]);
    mockUserFindMany.mockResolvedValue([
      {
        id: 10,
        name: "Test User",
        profileImageKey: null,
        googleImageURL: null,
      },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockMembershipsGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { term: "SPRING", year: 2026 },
      })
    );
    expect(await res.json()).toEqual([
      {
        userId: 10,
        name: "Test User",
        image: "resolved-image",
        membershipCount: 2,
        lastMembershipAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("POST returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: "not-json",
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: JSON.stringify({ userId: 1 }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST creates a membership record for valid input", async () => {
    mockGetCurrentSseOperationalTerm.mockReturnValue({
      term: "SPRING",
      year: 2026,
    });
    mockMembershipsCreate.mockResolvedValue({
      id: 1,
      userId: 15,
      reason: "Event Attendance",
      dateGiven: "2026-02-01T00:00:00.000Z",
    });

    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: JSON.stringify({
        userId: 15,
        reason: "Event Attendance",
        dateGiven: "2026-02-01",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockGetCurrentSseOperationalTerm).toHaveBeenCalledWith(
      new Date("2026-02-01T00:00:00.000Z")
    );
    expect(mockMembershipsCreate).toHaveBeenCalledWith({
      data: {
        userId: 15,
        reason: "Event Attendance",
        dateGiven: "2026-02-01T00:00:00.000Z",
        term: "SPRING",
        year: 2026,
      },
      select: { id: true, userId: true, reason: true, dateGiven: true },
    });
    expect(await res.json()).toEqual({
      id: 1,
      userId: 15,
      reason: "Event Attendance",
      dateGiven: "2026-02-01T00:00:00.000Z",
    });
  });

  it("POST uses SSE operational terms so summer dates land in Fall", async () => {
    mockGetCurrentSseOperationalTerm.mockReturnValue({
      term: "FALL",
      year: 2026,
    });
    mockMembershipsCreate.mockResolvedValue({
      id: 2,
      userId: 15,
      reason: "Event Attendance",
      dateGiven: "2026-06-15T00:00:00.000Z",
    });

    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: JSON.stringify({
        userId: 15,
        reason: "Event Attendance",
        dateGiven: "2026-06-15",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockMembershipsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          term: "FALL",
          year: 2026,
        }),
      })
    );
  });

  it("POST rejects unsupported manual reasons", async () => {
    const req = new Request("http://localhost/api/memberships", {
      method: "POST",
      body: JSON.stringify({
        userId: 15,
        reason: "Freeform Reason",
        dateGiven: "2026-02-01",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockMembershipsCreate).not.toHaveBeenCalled();
  });

  it("manual reason list stays stable for the memberships UI", () => {
    expect(MANUAL_MEMBERSHIP_REASONS).toEqual([
      "Event Attendance",
      "Lab Cleaning",
      "Mentoring Support",
      "Volunteer Work",
      "Donation",
      "Other Approved Contribution",
    ]);
  });
});

const emailBody = {
  awardId: "b2b32169-f454-4ab2-a171-e3dd1a5588b4",
  email: "new@g.rit.edu",
  reason: "Volunteer Work",
  dateGiven: "2026-10-26",
};
function awardRequest(body: unknown = emailBody) {
  return new Request("http://localhost/api/memberships", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("email membership awards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 1, isOfficer: true });
    mockCreateAward.mockResolvedValue({
      award: { id: emailBody.awardId, emailStatus: "PENDING" },
      membership: null,
    });
    mockSendAwardEmail.mockResolvedValue({
      emailStatus: "SENT",
      message: "Invitation sent.",
    });
  });
  it("rejects anonymous and non-officer requests before saving awards", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, isOfficer: false });
    expect((await POST(awardRequest())).status).toBe(401);
    mockAuth.mockResolvedValueOnce({ userId: 2, isOfficer: false });
    expect((await POST(awardRequest())).status).toBe(403);
    expect(mockCreateAward).not.toHaveBeenCalled();
  });
  it("normalizes emails and saves pending awards before sending email", async () => {
    const response = await POST(
      awardRequest({ ...emailBody, email: " New@G.RIT.EDU " })
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      status: "pending",
      awardId: emailBody.awardId,
      emailStatus: "SENT",
    });
    expect(mockCreateAward).toHaveBeenCalledWith(emailBody, 1);
    expect(mockSendAwardEmail).toHaveBeenCalledWith(
      emailBody.awardId,
      "https://sse.example"
    );
    expect(mockCreateAward.mock.invocationCallOrder[0]).toBeLessThan(
      mockSendAwardEmail.mock.invocationCallOrder[0]
    );
  });
  it("returns an immediate award without sending an invitation", async () => {
    mockCreateAward.mockResolvedValue({ award: {}, membership: { id: 4 } });
    const response = await POST(awardRequest());
    expect(await response.json()).toEqual({
      status: "awarded",
      membership: { id: 4 },
    });
    expect(mockSendAwardEmail).not.toHaveBeenCalled();
  });
  it("returns success when sign-in claims the saved award before email delivery starts", async () => {
    const membership = {
      id: 12,
      userId: 42,
      reason: emailBody.reason,
      dateGiven: "2026-10-26T00:00:00.000Z",
    };
    mockSendAwardEmail.mockResolvedValue({
      membership,
      message: "Membership already awarded.",
    });

    const response = await POST(awardRequest());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ status: "awarded", membership });
    expect(mockCreateAward).toHaveBeenCalledTimes(1);
    expect(mockSendAwardEmail).toHaveBeenCalledTimes(1);
  });
  it("reports failed delivery as a saved, claimable award", async () => {
    mockSendAwardEmail.mockResolvedValue({
      emailStatus: "FAILED",
      message: "Award saved, but email is not configured.",
    });
    const response = await POST(awardRequest());
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      status: "pending",
      emailStatus: "FAILED",
    });
  });
  it("does not resend an email when a save request is retried", async () => {
    mockCreateAward.mockResolvedValue({
      award: { id: emailBody.awardId, emailStatus: "SENT" },
      membership: null,
    });
    expect((await POST(awardRequest())).status).toBe(201);
    expect(mockSendAwardEmail).not.toHaveBeenCalled();
  });
  it.each([
    null,
    [],
    { ...emailBody, email: "new@rit.edu" },
    { ...emailBody, awardId: "bad" },
    { ...emailBody, dateGiven: "2026-02-30" },
  ])("rejects invalid recipient, request ID, or date: %j", async (body) => {
    expect((await POST(awardRequest(body))).status).toBe(400);
    expect(mockCreateAward).not.toHaveBeenCalled();
  });
});
