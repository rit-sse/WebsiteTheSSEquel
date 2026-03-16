import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const {
  mockGetServerSession,
  mockUserFindUnique,
  mockTechCommitteeApplicationCycleFindFirst,
  mockTechCommitteeApplicationFindMany,
  mockTechCommitteeApplicationFindFirst,
  mockTechCommitteeApplicationCreate,
  mockTechCommitteeApplicationUpdate,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockTechCommitteeApplicationCycleFindFirst: vi.fn(),
  mockTechCommitteeApplicationFindMany: vi.fn(),
  mockTechCommitteeApplicationFindFirst: vi.fn(),
  mockTechCommitteeApplicationCreate: vi.fn(),
  mockTechCommitteeApplicationUpdate: vi.fn(),
}));

vi.mock("next-auth/next", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mockUserFindUnique,
    },
    techCommitteeApplicationCycle: {
      findFirst: mockTechCommitteeApplicationCycleFindFirst,
    },
    techCommitteeApplication: {
      findMany: mockTechCommitteeApplicationFindMany,
      findFirst: mockTechCommitteeApplicationFindFirst,
      create: mockTechCommitteeApplicationCreate,
      update: mockTechCommitteeApplicationUpdate,
    },
  },
}));

import { GET, POST, PUT } from "@/app/api/tech-committee-application/route";

function req(url: string, method = "GET", body?: unknown) {
  return {
    method,
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/tech-committee-application route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(null);
    mockTechCommitteeApplicationCycleFindFirst.mockResolvedValue({
      id: 1,
      name: "Spring 2026",
      isOpen: true,
    });
    mockTechCommitteeApplicationFindFirst.mockResolvedValue(null);
  });

  it("GET my=true requires auth", async () => {
    const res = await GET(req("http://localhost/api/tech-committee-application?my=true"));
    expect(res.status).toBe(401);
  });

  it("POST requires sign-in", async () => {
    const res = await POST(req("http://localhost/api/tech-committee-application", "POST", {}));
    expect(res!.status).toBe(401);
  });

  it("POST rejects when submitted identity does not match account", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });

    const res = await POST(
      req("http://localhost/api/tech-committee-application", "POST", {
        name: "Someone Else",
        ritEmail: "student@g.rit.edu",
        yearLevel: "3rd",
        experienceText: "Built some projects",
        whyJoin: "Interested in contributing",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
      })
    );

    expect(res!.status).toBe(400);
  });

  it("POST rejects when applications are closed", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });
    mockTechCommitteeApplicationCycleFindFirst.mockResolvedValue(null);

    const res = await POST(
      req("http://localhost/api/tech-committee-application", "POST", {
        name: "Student User",
        ritEmail: "student@g.rit.edu",
        yearLevel: "3rd",
        experienceText: "Built some projects",
        whyJoin: "Interested in contributing",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
      })
    );

    expect(res!.status).toBe(400);
  });

  it("POST rejects duplicate active applications", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });
    mockTechCommitteeApplicationFindFirst.mockResolvedValue({ id: 99 });

    const res = await POST(
      req("http://localhost/api/tech-committee-application", "POST", {
        name: "Student User",
        ritEmail: "student@g.rit.edu",
        yearLevel: "3rd",
        experienceText: "Built some projects",
        whyJoin: "Interested in contributing",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
      })
    );

    expect(res!.status).toBe(409);
  });

  it("POST creates a pending Tech Committee application", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });
    mockTechCommitteeApplicationCreate.mockResolvedValue({
      id: 10,
      userId: 1,
      yearLevel: "3rd",
      experienceText: "Built some projects",
      whyJoin: "Interested in contributing",
      weeklyCommitment: "4 hours",
      preferredDivision: "Web Division",
      status: "PENDING",
      cycleId: 1,
    });

    const res = await POST(
      req("http://localhost/api/tech-committee-application", "POST", {
        name: "Student User",
        ritEmail: "student@g.rit.edu",
        yearLevel: "3rd",
        experienceText: "Built some projects",
        whyJoin: "Interested in contributing",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
      })
    );

    expect(res!.status).toBe(201);
    expect(mockTechCommitteeApplicationCreate).toHaveBeenCalledWith({
      data: {
        userId: 1,
        cycleId: 1,
        yearLevel: "3rd",
        experienceText: "Built some projects",
        whyJoin: "Interested in contributing",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
        status: "PENDING",
      },
    });
  });

  it("POST rejects oversized input even if the client-side limit is bypassed", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });

    const res = await POST(
      req("http://localhost/api/tech-committee-application", "POST", {
        name: "Student User",
        ritEmail: "student@g.rit.edu",
        yearLevel: "3rd",
        experienceText: "x".repeat(2001),
        whyJoin: "Interested in contributing",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
      })
    );

    expect(res!.status).toBe(400);
    expect(mockTechCommitteeApplicationCreate).not.toHaveBeenCalled();
  });

  it("POST returns conflict when a concurrent create hits the cycle unique constraint", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });
    mockTechCommitteeApplicationCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.22.0",
      })
    );

    const res = await POST(
      req("http://localhost/api/tech-committee-application", "POST", {
        name: "Student User",
        ritEmail: "student@g.rit.edu",
        yearLevel: "3rd",
        experienceText: "Built some projects",
        whyJoin: "Interested in contributing",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
      })
    );

    expect(res!.status).toBe(409);
  });

  it("PUT requires sign-in", async () => {
    const res = await PUT(req("http://localhost/api/tech-committee-application", "PUT", {}));
    expect(res!.status).toBe(401);
  });

  it("PUT rejects when application is not found for the signed-in user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });
    mockTechCommitteeApplicationFindFirst.mockResolvedValue(null);

    const res = await PUT(
      req("http://localhost/api/tech-committee-application", "PUT", {
        id: 10,
        name: "Student User",
        ritEmail: "student@g.rit.edu",
        yearLevel: "3rd",
        experienceText: "Updated experience",
        whyJoin: "Updated reason",
        weeklyCommitment: "5 hours",
        preferredDivision: "Services Division",
      })
    );

    expect(res!.status).toBe(404);
  });

  it("PUT rejects when application is not pending", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });
    mockTechCommitteeApplicationFindFirst.mockResolvedValue({
      id: 10,
      status: "APPROVED",
    });

    const res = await PUT(
      req("http://localhost/api/tech-committee-application", "PUT", {
        id: 10,
        name: "Student User",
        ritEmail: "student@g.rit.edu",
        yearLevel: "3rd",
        experienceText: "Updated experience",
        whyJoin: "Updated reason",
        weeklyCommitment: "5 hours",
        preferredDivision: "Services Division",
      })
    );

    expect(res!.status).toBe(409);
  });

  it("PUT updates a pending application for the signed-in user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "student@g.rit.edu" } });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      name: "Student User",
      email: "student@g.rit.edu",
    });
    mockTechCommitteeApplicationFindFirst.mockResolvedValue({
      id: 10,
      status: "PENDING",
    });
    mockTechCommitteeApplicationUpdate.mockResolvedValue({
      id: 10,
      userId: 1,
      yearLevel: "4th",
      experienceText: "Updated experience",
      whyJoin: "Updated reason",
      weeklyCommitment: "5 hours",
      preferredDivision: "Services Division",
      status: "PENDING",
    });

    const res = await PUT(
      req("http://localhost/api/tech-committee-application", "PUT", {
        id: 10,
        name: "Student User",
        ritEmail: "student@g.rit.edu",
        yearLevel: "4th",
        experienceText: "Updated experience",
        whyJoin: "Updated reason",
        weeklyCommitment: "5 hours",
        preferredDivision: "Services Division",
      })
    );

    expect(res!.status).toBe(200);
    expect(mockTechCommitteeApplicationUpdate).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        yearLevel: "4th",
        experienceText: "Updated experience",
        whyJoin: "Updated reason",
        weeklyCommitment: "5 hours",
        preferredDivision: "Services Division",
      },
    });
  });
});
