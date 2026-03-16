import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockTechCommitteeApplicationCycleFindFirst,
  mockTechCommitteeApplicationCycleCreate,
  mockTechCommitteeApplicationCycleUpdate,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockTechCommitteeApplicationCycleFindFirst: vi.fn(),
  mockTechCommitteeApplicationCycleCreate: vi.fn(),
  mockTechCommitteeApplicationCycleUpdate: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    techCommitteeApplicationCycle: {
      findFirst: mockTechCommitteeApplicationCycleFindFirst,
      create: mockTechCommitteeApplicationCycleCreate,
      update: mockTechCommitteeApplicationCycleUpdate,
    },
  },
}));

import {
  GET,
  PUT,
} from "@/app/api/tech-committee-application/config/route";

function getReq(url: string) {
  return {
    method: "GET",
    nextUrl: new URL(url),
  } as any;
}

function putReq(body?: unknown) {
  return {
    method: "PUT",
    nextUrl: new URL("http://localhost/api/tech-committee-application/config"),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/tech-committee-application/config route", () => {
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
      getReq("http://localhost/api/tech-committee-application/config")
    );

    expect(res.status).toBe(403);
  });

  it("returns the current application config for reviewers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: true,
      isPrimary: false,
    });
    mockTechCommitteeApplicationCycleFindFirst.mockResolvedValue({
      id: 1,
      name: "Spring 2026",
      isOpen: false,
    });

    const res = await GET(
      getReq("http://localhost/api/tech-committee-application/config")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: false });
    expect(mockTechCommitteeApplicationCycleFindFirst).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("defaults to open when no config row exists yet", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      isPrimary: false,
    });
    mockTechCommitteeApplicationCycleFindFirst.mockResolvedValue(null);

    const res = await GET(
      getReq("http://localhost/api/tech-committee-application/config")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: false });
  });

  it("updates the latest cycle for reviewers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      isPrimary: true,
    });
    mockTechCommitteeApplicationCycleFindFirst.mockResolvedValue({
      id: 1,
      name: "Spring 2026",
      isOpen: true,
    });
    mockTechCommitteeApplicationCycleUpdate.mockResolvedValue({
      id: 1,
      name: "Spring 2026",
      isOpen: false,
    });

    const res = await PUT(putReq({ isOpen: false }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: false });
    expect(mockTechCommitteeApplicationCycleUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isOpen: false },
    });
  });

  it("reopens the latest cycle when it already matches the current term", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      isPrimary: true,
    });
    mockTechCommitteeApplicationCycleFindFirst.mockResolvedValue({
      id: 1,
      name: "Spring 2026",
      isOpen: false,
    });
    mockTechCommitteeApplicationCycleUpdate.mockResolvedValue({
      id: 1,
      name: "Spring 2026",
      isOpen: true,
    });

    const res = await PUT(putReq({ isOpen: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: true });
    expect(mockTechCommitteeApplicationCycleUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isOpen: true },
    });
  });

  it("creates a new cycle when opening a new term", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      isPrimary: false,
    });
    mockTechCommitteeApplicationCycleFindFirst.mockResolvedValue({
      id: 1,
      name: "Fall 2025",
      isOpen: false,
    });
    mockTechCommitteeApplicationCycleCreate.mockResolvedValue({
      id: 2,
      name: "Spring 2026",
      isOpen: true,
    });

    const res = await PUT(putReq({ isOpen: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: true });
    expect(mockTechCommitteeApplicationCycleCreate).toHaveBeenCalledWith({
      data: {
        name: "Spring 2026",
        isOpen: true,
      },
    });
  });

  it("creates a cycle when none exists yet", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      isPrimary: false,
    });
    mockTechCommitteeApplicationCycleFindFirst.mockResolvedValue(null);
    mockTechCommitteeApplicationCycleCreate.mockResolvedValue({
      id: 2,
      name: "Spring 2026",
      isOpen: true,
    });

    const res = await PUT(putReq({ isOpen: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: true });
    expect(mockTechCommitteeApplicationCycleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Spring 2026",
        isOpen: true,
      }),
    });
  });

  it("rejects invalid config updates", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      isPrimary: false,
    });

    const res = await PUT(putReq({ isOpen: "false" }));

    expect(res.status).toBe(400);
  });
});
