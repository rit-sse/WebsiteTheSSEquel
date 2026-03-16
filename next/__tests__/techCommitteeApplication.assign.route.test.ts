import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockTechCommitteeApplicationFindUnique,
  mockTechCommitteeApplicationUpdate,
  mockIsEmailConfigured,
  mockSendEmail,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockTechCommitteeApplicationFindUnique: vi.fn(),
  mockTechCommitteeApplicationUpdate: vi.fn(),
  mockIsEmailConfigured: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    techCommitteeApplication: {
      findUnique: mockTechCommitteeApplicationFindUnique,
      update: mockTechCommitteeApplicationUpdate,
    },
  },
}));

vi.mock("@/lib/email", () => ({
  isEmailConfigured: mockIsEmailConfigured,
  sendEmail: mockSendEmail,
}));

import { PUT } from "@/app/api/tech-committee-application/assign/route";

function req(body?: unknown) {
  return {
    method: "PUT",
    headers: new Headers({ host: "localhost:3000" }),
    nextUrl: new URL("http://localhost:3000/api/tech-committee-application/assign"),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/tech-committee-application/assign route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
    });
    mockIsEmailConfigured.mockReturnValue(true);
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("rejects non-reviewers", async () => {
    const res = await PUT(req({ id: 7, finalDivision: "Web Division" }));
    expect(res.status).toBe(403);
  });

  it("rejects invalid divisions", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
    });

    const res = await PUT(req({ id: 7, finalDivision: "Random Division" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the application does not exist", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: true,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue(null);

    const res = await PUT(req({ id: 7, finalDivision: "Web Division" }));
    expect(res.status).toBe(404);
  });

  it("returns conflict for non-approved applications", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 7,
      status: "PENDING",
      user: {
        id: 12,
        name: "Student User",
        email: "student@g.rit.edu",
      },
    });

    const res = await PUT(req({ id: 7, finalDivision: "Web Division" }));
    expect(res.status).toBe(409);
  });

  it("assigns an approved application to a final division", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: true,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 7,
      status: "APPROVED",
      user: {
        id: 12,
        name: "Student User",
        email: "student@g.rit.edu",
      },
    });
    mockTechCommitteeApplicationUpdate.mockResolvedValue({
      id: 7,
      status: "ASSIGNED",
      finalDivision: "Lab Division",
      user: {
        id: 12,
        name: "Student User",
        email: "student@g.rit.edu",
      },
    });

    const res = await PUT(req({ id: 7, finalDivision: "Lab Division" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockTechCommitteeApplicationUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        finalDivision: "Lab Division",
        status: "ASSIGNED",
      },
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
    expect(body.status).toBe("ASSIGNED");
    expect(body.finalDivision).toBe("Lab Division");
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("returns 503 and rolls back when email is not configured for assignment", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
    });
    mockIsEmailConfigured.mockReturnValue(false);
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 8,
      status: "APPROVED",
      finalDivision: null,
      user: {
        id: 13,
        name: "No Mail User",
        email: "nomail@g.rit.edu",
      },
    });
    mockTechCommitteeApplicationUpdate
      .mockResolvedValueOnce({
        id: 8,
        status: "ASSIGNED",
        finalDivision: "Web Division",
        user: {
          id: 13,
          name: "No Mail User",
          email: "nomail@g.rit.edu",
        },
      })
      .mockResolvedValueOnce({
        id: 8,
        status: "APPROVED",
        finalDivision: null,
      });

    const res = await PUT(req({ id: 8, finalDivision: "Web Division" }));

    expect(res.status).toBe(503);
    expect(mockTechCommitteeApplicationUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 8 },
      data: {
        status: "APPROVED",
        finalDivision: null,
      },
    });
  });

  it("returns 502 and rolls back when onboarding email fails", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: true,
    });
    mockSendEmail.mockRejectedValue(new Error("smtp failed"));
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 9,
      status: "APPROVED",
      finalDivision: null,
      user: {
        id: 14,
        name: "Mail Fail User",
        email: "mailfail@g.rit.edu",
      },
    });
    mockTechCommitteeApplicationUpdate
      .mockResolvedValueOnce({
        id: 9,
        status: "ASSIGNED",
        finalDivision: "Services Division",
        user: {
          id: 14,
          name: "Mail Fail User",
          email: "mailfail@g.rit.edu",
        },
      })
      .mockResolvedValueOnce({
        id: 9,
        status: "APPROVED",
        finalDivision: null,
      });

    const res = await PUT(req({ id: 9, finalDivision: "Services Division" }));

    expect(res.status).toBe(502);
    expect(mockTechCommitteeApplicationUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 9 },
      data: {
        status: "APPROVED",
        finalDivision: null,
      },
    });
  });

  it("allows division managers to assign into their own division", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: true,
      techCommitteeManagedDivision: "Lab Division",
      isPrimary: false,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 10,
      status: "APPROVED",
      finalDivision: null,
      user: {
        id: 20,
        name: "Division Managed User",
        email: "division@g.rit.edu",
      },
    });
    mockTechCommitteeApplicationUpdate.mockResolvedValue({
      id: 10,
      status: "ASSIGNED",
      finalDivision: "Lab Division",
      user: {
        id: 20,
        name: "Division Managed User",
        email: "division@g.rit.edu",
      },
    });

    const res = await PUT(req({ id: 10, finalDivision: "Lab Division" }));

    expect(res.status).toBe(200);
  });

  it("forbids division managers from assigning outside their own division", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: true,
      techCommitteeManagedDivision: "Lab Division",
      isPrimary: false,
    });

    const res = await PUT(req({ id: 11, finalDivision: "Web Division" }));

    expect(res.status).toBe(403);
  });
});
