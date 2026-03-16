import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockTechCommitteeApplicationFindMany,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockTechCommitteeApplicationFindMany: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    techCommitteeApplication: {
      findMany: mockTechCommitteeApplicationFindMany,
    },
  },
}));

import { GET } from "@/app/api/tech-committee-application/apps/route";

function req(url: string) {
  return {
    method: "GET",
    nextUrl: new URL(url),
  } as any;
}

describe("/api/tech-committee-application/apps route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      isPrimary: false,
    });
  });

  it("rejects non-reviewers", async () => {
    const res = await GET(
      req("http://localhost/api/tech-committee-application/apps")
    );

    expect(res.status).toBe(403);
  });

  it("returns applications for reviewers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      isPrimary: false,
    });
    mockTechCommitteeApplicationFindMany.mockResolvedValue([
      {
        id: 1,
        userId: 12,
        yearLevel: "3rd",
        experienceText: "Built internal tools",
        whyJoin: "Contribute to Tech Committee",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
        status: "PENDING",
        finalDivision: null,
        createdAt: new Date("2026-03-01T12:00:00.000Z"),
        updatedAt: new Date("2026-03-01T12:00:00.000Z"),
        user: {
          id: 12,
          name: "Student User",
          email: "student@g.rit.edu",
        },
      },
    ]);

    const res = await GET(
      req("http://localhost/api/tech-committee-application/apps")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockTechCommitteeApplicationFindMany).toHaveBeenCalledWith({
      where: undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(body).toHaveLength(1);
    expect(body[0].user.email).toBe("student@g.rit.edu");
  });

  it("applies a status filter when provided", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      isPrimary: true,
    });
    mockTechCommitteeApplicationFindMany.mockResolvedValue([]);

    const res = await GET(
      req("http://localhost/api/tech-committee-application/apps?status=pending")
    );

    expect(res.status).toBe(200);
    expect(mockTechCommitteeApplicationFindMany).toHaveBeenCalledWith({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns applications for division managers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: true,
      isPrimary: false,
    });
    mockTechCommitteeApplicationFindMany.mockResolvedValue([]);

    const res = await GET(
      req("http://localhost/api/tech-committee-application/apps")
    );

    expect(res.status).toBe(200);
  });

  it("rejects invalid status filters", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      isPrimary: false,
    });

    const res = await GET(
      req("http://localhost/api/tech-committee-application/apps?status=bad")
    );

    expect(res.status).toBe(400);
    expect(mockTechCommitteeApplicationFindMany).not.toHaveBeenCalled();
  });
});
