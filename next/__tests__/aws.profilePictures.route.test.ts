import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockNormalizeToS3Key,
  mockGetSignedUploadUrl,
  mockDeleteObject,
  mockUserFindFirst,
  mockUserUpdate,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockNormalizeToS3Key: vi.fn(),
  mockGetSignedUploadUrl: vi.fn(),
  mockDeleteObject: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockUserUpdate: vi.fn(),
}));

vi.mock("@/lib/sessionToken", () => ({
  getSessionToken: mockGetSessionToken,
}));

vi.mock("@/lib/s3Utils", () => ({
  normalizeToS3Key: mockNormalizeToS3Key,
  resolveUserImage: vi.fn(),
  getPublicS3Url: vi.fn(),
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    getSignedUploadUrl: mockGetSignedUploadUrl,
    deleteObject: mockDeleteObject,
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockUserFindFirst,
      update: mockUserUpdate,
    },
  },
}));

import { POST, PUT } from "@/app/api/aws/profilePictures/route";

describe("/api/aws/profilePictures route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionToken.mockReturnValue("token");
    mockUserFindFirst.mockResolvedValue({ id: 7, profileImageKey: null });
  });

  it("POST requires auth", async () => {
    mockGetSessionToken.mockReturnValue(null);
    const req = {} as any;
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("POST validates image content type", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({ filename: "file.txt", contentType: "text/plain" }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns signed upload url", async () => {
    mockGetSignedUploadUrl.mockResolvedValue("https://signed.example.com");
    const req = {
      json: vi.fn().mockResolvedValue({ filename: "pic.png", contentType: "image/png" }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ uploadUrl: "https://signed.example.com" });
  });

  it("PUT rejects keys outside current user namespace", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({ key: "uploads/profile-pictures/88/file.png" }),
    } as any;

    const res = await PUT(req);
    expect(res.status).toBe(403);
  });

  it("PUT saves new profile image key", async () => {
    mockNormalizeToS3Key.mockReturnValue(null);

    const req = {
      json: vi.fn().mockResolvedValue({ key: "uploads/profile-pictures/7/file.png" }),
    } as any;

    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalled();
  });
});
