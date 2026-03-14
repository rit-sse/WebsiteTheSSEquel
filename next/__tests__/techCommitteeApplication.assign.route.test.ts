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
      isPrimary: false,
    });

    const res = await PUT(req({ id: 7, finalDivision: "Random Division" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the application does not exist", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isPrimary: true,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue(null);

    const res = await PUT(req({ id: 7, finalDivision: "Web Division" }));
    expect(res.status).toBe(404);
  });

  it("returns conflict for non-approved applications", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isPrimary: false,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 7,
      status: "pending",
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
      isPrimary: true,
    });
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 7,
      status: "approved",
      user: {
        id: 12,
        name: "Student User",
        email: "student@g.rit.edu",
      },
    });
    mockTechCommitteeApplicationUpdate.mockResolvedValue({
      id: 7,
      status: "assigned",
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
        status: "assigned",
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
    expect(body.status).toBe("assigned");
    expect(body.finalDivision).toBe("Lab Division");
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("returns 503 and rolls back when email is not configured for assignment", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isPrimary: false,
    });
    mockIsEmailConfigured.mockReturnValue(false);
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 8,
      status: "approved",
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
        status: "assigned",
        finalDivision: "Web Division",
        user: {
          id: 13,
          name: "No Mail User",
          email: "nomail@g.rit.edu",
        },
      })
      .mockResolvedValueOnce({
        id: 8,
        status: "approved",
        finalDivision: null,
      });

    const res = await PUT(req({ id: 8, finalDivision: "Web Division" }));

    expect(res.status).toBe(503);
    expect(mockTechCommitteeApplicationUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 8 },
      data: {
        status: "approved",
        finalDivision: null,
      },
    });
  });

  it("returns 502 and rolls back when onboarding email fails", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isPrimary: true,
    });
    mockSendEmail.mockRejectedValue(new Error("smtp failed"));
    mockTechCommitteeApplicationFindUnique.mockResolvedValue({
      id: 9,
      status: "approved",
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
        status: "assigned",
        finalDivision: "Services Division",
        user: {
          id: 14,
          name: "Mail Fail User",
          email: "mailfail@g.rit.edu",
        },
      })
      .mockResolvedValueOnce({
        id: 9,
        status: "approved",
        finalDivision: null,
      });

    const res = await PUT(req({ id: 9, finalDivision: "Services Division" }));

    expect(res.status).toBe(502);
    expect(mockTechCommitteeApplicationUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 9 },
      data: {
        status: "approved",
        finalDivision: null,
      },
    });
  });
});
