import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveAuthLevelFromRequest,
  mockGetSignedUploadUrl,
  mockTextbooksFindUnique,
  mockTextbooksUpdate,
  mockNormalizeToS3Key,
} = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
  mockGetSignedUploadUrl: vi.fn(),
  mockTextbooksFindUnique: vi.fn(),
  mockTextbooksUpdate: vi.fn(),
  mockNormalizeToS3Key: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    getSignedUploadUrl: mockGetSignedUploadUrl,
    deleteObject: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    textbooks: {
      findUnique: mockTextbooksFindUnique,
      update: mockTextbooksUpdate,
    },
  },
}));

vi.mock("@/lib/s3Utils", () => ({
  normalizeToS3Key: mockNormalizeToS3Key,
}));

import { POST } from "@/app/api/aws/libraryBooks/route";

function makeRequest(body: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

describe("/api/aws/libraryBooks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isMentor: true,
    });
    mockGetSignedUploadUrl.mockResolvedValue("https://signed-upload.example");
    mockTextbooksFindUnique.mockResolvedValue({ imageKey: null });
    mockTextbooksUpdate.mockResolvedValue({});
    mockNormalizeToS3Key.mockReturnValue(null);
  });

  it("POST requires mentor or officer auth", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isMentor: false,
    });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("POST validates required fields", async () => {
    const res = await POST(makeRequest({ filename: "cover.jpg", isbn: "123" }));
    expect(res.status).toBe(400);
  });

  it("POST returns a presigned upload URL and key", async () => {
    const res = await POST(
      makeRequest({
        filename: "rapid.jpg",
        contentType: "image/jpeg",
        isbn: "9781556159008",
      })
    );

    expect(res.status).toBe(200);
    expect(mockGetSignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(
        /^uploads\/library-books\/9781556159008\/\d+-rapid\.jpg$/
      ),
      "image/jpeg",
      300
    );

    const body = await res.json();
    expect(body.uploadUrl).toBe("https://signed-upload.example");
    expect(body.key).toMatch(
      /^uploads\/library-books\/9781556159008\/\d+-rapid\.jpg$/
    );
  });
});
