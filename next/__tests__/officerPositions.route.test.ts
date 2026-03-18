import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveUserImage,
  mockGetGatewayAuthLevel,
  mockPositionFindMany,
  mockPositionCreate,
  mockPositionUpdate,
  mockPositionDelete,
  mockOfficerCount,
  mockOfficerDeleteMany,
} = vi.hoisted(() => ({
  mockResolveUserImage: vi.fn(),
  mockGetGatewayAuthLevel: vi.fn(),
  mockPositionFindMany: vi.fn(),
  mockPositionCreate: vi.fn(),
  mockPositionUpdate: vi.fn(),
  mockPositionDelete: vi.fn(),
  mockOfficerCount: vi.fn(),
  mockOfficerDeleteMany: vi.fn(),
}));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    officerPosition: {
      findMany: mockPositionFindMany,
      create: mockPositionCreate,
      update: mockPositionUpdate,
      delete: mockPositionDelete,
    },
    officer: {
      count: mockOfficerCount,
      deleteMany: mockOfficerDeleteMany,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/officer-positions/route";

describe("/api/officer-positions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
    mockGetGatewayAuthLevel.mockResolvedValue({ isPrimary: true });
  });

  it("GET returns positions with filled status and transformed officer", async () => {
    mockPositionFindMany.mockResolvedValue([
      {
        id: 1,
        title: "President",
        is_primary: true,
        email: "sse-president@rit.edu",
        officers: [
          {
            id: 11,
            user: {
              id: 9,
              name: "Officer A",
              email: "a@g.rit.edu",
              profileImageKey: null,
              googleImageURL: null,
            },
            start_date: "2026-01-01",
            end_date: "2026-12-31",
          },
        ],
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0]).toMatchObject({
      id: 1,
      isFilled: true,
      currentOfficer: {
        id: 11,
        userId: 9,
        image: "resolved-image",
      },
    });
  });

  it("POST requires title", async () => {
    const req = new Request("http://localhost/api/officer-positions", {
      method: "POST",
      body: JSON.stringify({ is_primary: true }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("PUT requires id", async () => {
    const req = new Request("http://localhost/api/officer-positions", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("DELETE blocks when active officers still exist", async () => {
    mockOfficerCount.mockResolvedValue(1);

    const req = new Request("http://localhost/api/officer-positions", {
      method: "DELETE",
      body: JSON.stringify({ id: 5 }),
      headers: { "content-type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(409);
  });

  it("DELETE removes inactive officers then deletes position", async () => {
    mockOfficerCount.mockResolvedValue(0);
    mockPositionDelete.mockResolvedValue({ id: 5, title: "Role" });

    const req = new Request("http://localhost/api/officer-positions", {
      method: "DELETE",
      body: JSON.stringify({ id: 5 }),
      headers: { "content-type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(mockOfficerDeleteMany).toHaveBeenCalledWith({ where: { position_id: 5 } });
    expect(await res.json()).toEqual({ id: 5, title: "Role" });
  });
});
