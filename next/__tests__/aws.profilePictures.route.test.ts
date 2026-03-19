import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSessionToken,
  mockNormalizeToS3Key,
  mockPutObject,
  mockDeleteObject,
  mockUserFindFirst,
  mockUserUpdate,
} = vi.hoisted(() => ({
  mockGetSessionToken: vi.fn(),
  mockNormalizeToS3Key: vi.fn(),
  mockPutObject: vi.fn(),
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
    putObject: mockPutObject,
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

function makeUploadRequest(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as any;
}

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

  it("POST rejects non-image bytes even if the declared type is image/jpeg", async () => {
    const req = makeUploadRequest(
      new File([Buffer.from("not actually an image")], "file.jpg", {
        type: "image/jpeg",
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("POST rejects SVG uploads", async () => {
    const req = makeUploadRequest(
      new File(
        ['<svg xmlns="http://www.w3.org/2000/svg"></svg>'],
        "vector.svg",
        {
          type: "image/svg+xml",
        }
      )
    );

    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("POST rejects uploads larger than 5MB", async () => {
    const req = makeUploadRequest(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "huge.png", {
        type: "image/png",
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("POST uploads a valid PNG and returns a namespaced key", async () => {
    const req = makeUploadRequest(
      new File(
        [
          Uint8Array.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
          ]),
        ],
        "pic.png",
        { type: "image/png" }
      )
    );

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.key).toMatch(
      /^uploads\/profile-pictures\/7\/\d+-[a-f0-9-]+\.png$/
    );
    expect(mockPutObject).toHaveBeenCalledTimes(1);
  });

  it("PUT rejects keys outside current user namespace", async () => {
    const req = {
      json: vi
        .fn()
        .mockResolvedValue({ key: "uploads/profile-pictures/88/file.png" }),
    } as any;

    const res = await PUT(req);
    expect(res.status).toBe(403);
  });

  it("PUT saves new profile image key", async () => {
    mockNormalizeToS3Key.mockReturnValue(null);

    const req = {
      json: vi
        .fn()
        .mockResolvedValue({ key: "uploads/profile-pictures/7/file.png" }),
    } as any;

    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalled();
  });
});
