import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockTechCommitteeApplicationFindUnique,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockTechCommitteeApplicationFindUnique: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    techCommitteeApplication: {
      findUnique: mockTechCommitteeApplicationFindUnique,
    },
  },
}));

import { GET } from "@/app/api/tech-committee-application/apps/[id]/route";

function req(url: string) {
  return {
    method: "GET",
    nextUrl: new URL(url),
  } as any;
}

describe("/api/tech-committee-application/apps/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isPrimary: false,
    });
  });

  it("rejects non-reviewers", async () => {
    const res = await GET(req("http://localhost/api/tech-committee-application/apps/7"), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(res.status).toBe(403);
  });

  it("returns 404 when the application does not exist", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isPrimary: false,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue(null);

    const res = await GET(req("http://localhost/api/tech-committee-application/apps/7"), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns the requested application for reviewers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isPrimary: true,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 7,
      userId: 12,
      yearLevel: "3rd",
      experienceText: "Built internal tools",
      whyJoin: "Contribute to Tech Committee",
      weeklyCommitment: "4 hours",
      preferredDivision: "Web Division",
      status: "pending",
      finalDivision: null,
      user: {
        id: 12,
        name: "Student User",
        email: "student@g.rit.edu",
      },
    });

    const res = await GET(req("http://localhost/api/tech-committee-application/apps/7"), {
      params: Promise.resolve({ id: "7" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockTechCommitteeApplicationFindUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    expect(body.id).toBe(7);
  });
});
