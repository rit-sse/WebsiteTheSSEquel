import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindMany,
  mockCreate,
  mockUpdate,
  mockDelete,
  mockGetImageUrl,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockGetImageUrl: vi.fn(),
}));

vi.mock("@/lib/s3Utils", () => ({
  getImageUrl: mockGetImageUrl,
  resolveUserImage: vi.fn(),
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    alumni: {
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/alumni/route";

describe("/api/alumni route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetImageUrl.mockReturnValue("resolved-image");
  });

  it("GET returns alumni with resolved image and imageKey", async () => {
    mockFindMany.mockResolvedValue([{ id: 1, name: "Alum", image: "key" }]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 1, name: "Alum", image: "resolved-image", imageKey: "key" },
    ]);
  });

  it("POST validates required fields", async () => {
    const req = new Request("http://localhost/api/alumni", {
      method: "POST",
      body: JSON.stringify({ name: "A" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("PUT requires id", async () => {
    const req = new Request("http://localhost/api/alumni", {
      method: "PUT",
      body: JSON.stringify({ quote: "q" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PUT(req);
    expect(res.status).toBe(422);
  });

  it("DELETE requires numeric id", async () => {
    const req = new Request("http://localhost/api/alumni", {
      method: "DELETE",
      body: JSON.stringify({ id: "bad" }),
      headers: { "content-type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});
