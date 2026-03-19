import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveAuthLevelFromRequest,
  mockPutObject,
  mockTextbooksFindUnique,
  mockTextbooksUpdate,
  mockNormalizeToS3Key,
} = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
  mockPutObject: vi.fn(),
  mockTextbooksFindUnique: vi.fn(),
  mockTextbooksUpdate: vi.fn(),
  mockNormalizeToS3Key: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    putObject: mockPutObject,
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

function makeUploadRequest(file: File | null, isbn = "9781556159008") {
  const formData = new FormData();
  if (file) formData.append("file", file);
  formData.append("isbn", isbn);

  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as any;
}

describe("/api/aws/libraryBooks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isMentor: true,
    });
    mockPutObject.mockResolvedValue(undefined);
    mockTextbooksFindUnique.mockResolvedValue({ imageKey: null });
    mockTextbooksUpdate.mockResolvedValue({});
    mockNormalizeToS3Key.mockReturnValue(null);
  });

  it("POST requires mentor or officer auth", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isMentor: false,
    });

    const res = await POST(makeUploadRequest(null));
    expect(res.status).toBe(401);
  });

  it("POST rejects non-image bytes even when declared as an image", async () => {
    const req = makeUploadRequest(
      new File([Buffer.from("not an image")], "cover.jpg", {
        type: "image/jpeg",
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("POST uploads a valid PNG and returns an S3 key", async () => {
    const req = makeUploadRequest(
      new File(
        [
          Uint8Array.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
          ]),
        ],
        "rapid.png",
        { type: "image/png" }
      )
    );

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockPutObject).toHaveBeenCalledWith(
      expect.stringMatching(
        /^uploads\/library-books\/9781556159008\/\d+-rapid-[a-f0-9-]+\.png$/
      ),
      expect.any(Uint8Array),
      "image/png"
    );

    const body = await res.json();
    expect(body.key).toMatch(
      /^uploads\/library-books\/9781556159008\/\d+-rapid-[a-f0-9-]+\.png$/
    );
  });
});
