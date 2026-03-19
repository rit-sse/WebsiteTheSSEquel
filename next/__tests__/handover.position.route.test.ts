import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveAuthLevelFromRequest,
  mockPositionFindUnique,
  mockHandoverFindUnique,
  mockHandoverCreate,
  mockHandoverUpsert,
} = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
  mockPositionFindUnique: vi.fn(),
  mockHandoverFindUnique: vi.fn(),
  mockHandoverCreate: vi.fn(),
  mockHandoverUpsert: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    officerPosition: {
      findUnique: mockPositionFindUnique,
    },
    handoverDocument: {
      findUnique: mockHandoverFindUnique,
      create: mockHandoverCreate,
      upsert: mockHandoverUpsert,
    },
  },
}));

import { GET, PUT } from "@/app/api/handover/[positionId]/route";

describe("/api/handover/[positionId] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({ isOfficer: true });
  });

  it("GET denies non-officers", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({ isOfficer: false });

    const res = await GET(new Request("http://localhost/api/handover/1"), {
      params: Promise.resolve({ positionId: "1" }),
    });

    expect(res.status).toBe(403);
  });

  it("GET returns 400 for invalid position id", async () => {
    const res = await GET(new Request("http://localhost/api/handover/bad"), {
      params: Promise.resolve({ positionId: "bad" }),
    });

    expect(res.status).toBe(400);
  });

  it("GET creates a default document when one does not exist", async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1, title: "President" });
    mockHandoverFindUnique.mockResolvedValue(null);
    mockHandoverCreate.mockResolvedValue({
      id: 9,
      positionId: 1,
      content: "seed",
    });

    const res = await GET(new Request("http://localhost/api/handover/1"), {
      params: Promise.resolve({ positionId: "1" }),
    });

    expect(res.status).toBe(200);
    expect(mockHandoverCreate).toHaveBeenCalled();
    expect(await res.json()).toEqual({ id: 9, positionId: 1, content: "seed" });
  });

  it("PUT validates content payload", async () => {
    const req = new Request("http://localhost/api/handover/1", {
      method: "PUT",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const res = await PUT(req, {
      params: Promise.resolve({ positionId: "1" }),
    });

    expect(res.status).toBe(400);
  });

  it("PUT upserts document when payload is valid", async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1, title: "President" });
    mockHandoverUpsert.mockResolvedValue({
      id: 2,
      positionId: 1,
      content: "updated",
    });

    const req = new Request("http://localhost/api/handover/1", {
      method: "PUT",
      body: JSON.stringify({ content: "updated" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PUT(req, {
      params: Promise.resolve({ positionId: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: 2,
      positionId: 1,
      content: "updated",
    });
  });
});
