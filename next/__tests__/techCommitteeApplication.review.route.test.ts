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

import { PUT } from "@/app/api/tech-committee-application/review/route";

function req(body?: unknown) {
  return {
    method: "PUT",
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/tech-committee-application/review route", () => {
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
    const res = await PUT(req({ id: 7, action: "approve" }));
    expect(res.status).toBe(403);
  });

  it("rejects unsupported actions", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
    });

    const res = await PUT(req({ id: 7, action: "assign" }));
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

    const res = await PUT(req({ id: 7, action: "approve" }));
    expect(res.status).toBe(404);
  });

  it("returns conflict for non-pending applications", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
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

    const res = await PUT(req({ id: 7, action: "approve" }));
    expect(res.status).toBe(409);
  });

  it("approves a pending application for reviewers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: true,
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
    mockTechCommitteeApplicationUpdate.mockResolvedValue({
      id: 7,
      status: "APPROVED",
      user: {
        id: 12,
        name: "Student User",
        email: "student@g.rit.edu",
      },
    });

    const res = await PUT(req({ id: 7, action: "approve" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockTechCommitteeApplicationUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: "APPROVED" },
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
    expect(body.status).toBe("APPROVED");
  });

  it("rejects a pending application and sends email", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 8,
      status: "PENDING",
      user: {
        id: 13,
        name: "Rejected User",
        email: "rejected@g.rit.edu",
      },
    });
    mockTechCommitteeApplicationUpdate.mockResolvedValueOnce({
      id: 8,
      status: "REJECTED",
      user: {
        id: 13,
        name: "Rejected User",
        email: "rejected@g.rit.edu",
      },
    });

    const res = await PUT(req({ id: 8, action: "reject" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockTechCommitteeApplicationUpdate).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { status: "REJECTED" },
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
    expect(mockSendEmail).toHaveBeenCalled();
    expect(body.status).toBe("REJECTED");
  });

  it("returns 503 without changing status when email is not configured for rejection", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: true,
    });
    mockIsEmailConfigured.mockReturnValue(false);
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 9,
      status: "PENDING",
      user: {
        id: 14,
        name: "No Mail User",
        email: "nomail@g.rit.edu",
      },
    });
    const res = await PUT(req({ id: 9, action: "reject" }));

    expect(res.status).toBe(503);
    expect(mockTechCommitteeApplicationUpdate).not.toHaveBeenCalled();
  });

  it("returns 502 without changing status when rejection email fails", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      techCommitteeManagedDivision: null,
      isPrimary: false,
    });
    mockSendEmail.mockRejectedValue(new Error("smtp failed"));
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 10,
      status: "PENDING",
      user: {
        id: 15,
        name: "Mail Fail User",
        email: "mailfail@g.rit.edu",
      },
    });
    const res = await PUT(req({ id: 10, action: "reject" }));

    expect(res.status).toBe(502);
    expect(mockTechCommitteeApplicationUpdate).not.toHaveBeenCalled();
  });

  it("allows division managers to approve pending applications", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: true,
      techCommitteeManagedDivision: "Lab Division",
      isPrimary: false,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 11,
      status: "PENDING",
      user: {
        id: 16,
        name: "Manager Action User",
        email: "manager@g.rit.edu",
      },
    });
    mockTechCommitteeApplicationUpdate.mockResolvedValue({
      id: 11,
      status: "APPROVED",
      user: {
        id: 16,
        name: "Manager Action User",
        email: "manager@g.rit.edu",
      },
    });

    const res = await PUT(req({ id: 11, action: "approve" }));

    expect(res.status).toBe(200);
  });
});
