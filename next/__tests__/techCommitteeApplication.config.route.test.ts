import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetGatewayAuthLevel,
  mockTechCommitteeApplicationConfigFindUnique,
  mockTechCommitteeApplicationConfigUpsert,
} = vi.hoisted(() => ({
  mockGetGatewayAuthLevel: vi.fn(),
  mockTechCommitteeApplicationConfigFindUnique: vi.fn(),
  mockTechCommitteeApplicationConfigUpsert: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    techCommitteeApplicationConfig: {
      findUnique: mockTechCommitteeApplicationConfigFindUnique,
      upsert: mockTechCommitteeApplicationConfigUpsert,
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
    mockTechCommitteeApplicationConfigFindUnique.mockResolvedValue({
      id: 1,
      isOpen: false,
    });

    const res = await GET(
      getReq("http://localhost/api/tech-committee-application/config")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: false });
    expect(mockTechCommitteeApplicationConfigFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it("defaults to open when no config row exists yet", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: true,
      isTechCommitteeDivisionManager: false,
      isPrimary: false,
    });
    mockTechCommitteeApplicationConfigFindUnique.mockResolvedValue(null);

    const res = await GET(
      getReq("http://localhost/api/tech-committee-application/config")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: true });
  });

  it("updates the config for reviewers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue({
      isTechCommitteeHead: false,
      isTechCommitteeDivisionManager: false,
      isPrimary: true,
    });
    mockTechCommitteeApplicationConfigUpsert.mockResolvedValue({
      id: 1,
      isOpen: false,
    });

    const res = await PUT(putReq({ isOpen: false }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isOpen: false });
    expect(mockTechCommitteeApplicationConfigUpsert).toHaveBeenCalledWith({
      where: { id: 1 },
      update: { isOpen: false },
      create: {
        id: 1,
        isOpen: false,
      },
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
