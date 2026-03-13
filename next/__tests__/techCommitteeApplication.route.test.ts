import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetServerSession,
  mockUserFindUnique,
  mockTechCommitteeApplicationConfigFindUnique,
  mockTechCommitteeApplicationFindMany,
  mockTechCommitteeApplicationFindFirst,
  mockTechCommitteeApplicationCreate,
  mockTechCommitteeApplicationUpdate,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockTechCommitteeApplicationConfigFindUnique: vi.fn(),
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
    techCommitteeApplicationConfig: {
      findUnique: mockTechCommitteeApplicationConfigFindUnique,
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
    mockTechCommitteeApplicationConfigFindUnique.mockResolvedValue({ id: 1, isOpen: true });
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
    mockTechCommitteeApplicationConfigFindUnique.mockResolvedValue({
      id: 1,
      isOpen: false,
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
      status: "pending",
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
        yearLevel: "3rd",
        experienceText: "Built some projects",
        whyJoin: "Interested in contributing",
        weeklyCommitment: "4 hours",
        preferredDivision: "Web Division",
        status: "pending",
      },
    });
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
      status: "approved",
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
      status: "pending",
    });
    mockTechCommitteeApplicationUpdate.mockResolvedValue({
      id: 10,
      userId: 1,
      yearLevel: "4th",
      experienceText: "Updated experience",
      whyJoin: "Updated reason",
      weeklyCommitment: "5 hours",
      preferredDivision: "Services Division",
      status: "pending",
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
