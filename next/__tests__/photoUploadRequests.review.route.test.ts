import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveAuthLevelFromRequest,
  mockHeadObject,
  mockGetObjectBytes,
  mockPhotoUploadRequestFindUnique,
  mockPhotoUploadRequestUpdate,
  mockEventFindUnique,
  mockPhotoCreate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
  mockHeadObject: vi.fn(),
  mockGetObjectBytes: vi.fn(),
  mockPhotoUploadRequestFindUnique: vi.fn(),
  mockPhotoUploadRequestUpdate: vi.fn(),
  mockEventFindUnique: vi.fn(),
  mockPhotoCreate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    headObject: mockHeadObject,
    getObjectBytes: mockGetObjectBytes,
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      findUnique: mockEventFindUnique,
    },
    photoUploadRequest: {
      findUnique: mockPhotoUploadRequestFindUnique,
      update: mockPhotoUploadRequestUpdate,
    },
    photo: {
      create: mockPhotoCreate,
    },
    $transaction: mockTransaction,
  },
}));

import { PATCH } from "@/app/api/photo-upload-requests/[id]/route";

function req(body: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

const params = { params: Promise.resolve({ id: "22" }) };

describe("/api/photo-upload-requests/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: true,
      isSeAdmin: false,
      userId: 7,
    });
    mockPhotoUploadRequestFindUnique.mockResolvedValue(requestRecord());
    mockPhotoUploadRequestUpdate.mockImplementation(({ data }) =>
      Promise.resolve({ id: 22, ...data }),
    );
    mockPhotoCreate.mockResolvedValue({ id: 33 });
    mockTransaction.mockImplementation((callback) =>
      callback({
        photoUploadRequest: {
          findUnique: vi.fn().mockResolvedValue({ status: "pending" }),
          update: mockPhotoUploadRequestUpdate,
        },
        photo: {
          create: mockPhotoCreate,
        },
      }),
    );
    mockHeadObject.mockResolvedValue({ contentLength: 10 });
    mockGetObjectBytes.mockImplementation((key: string) =>
      Promise.resolve(
        key.endsWith(".webp")
          ? new Uint8Array([
              0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
            ])
          : new Uint8Array([0xff, 0xd8, 0xff]),
      ),
    );
    mockEventFindUnique.mockResolvedValue({ id: "event-1" });
  });

  it("requires officer auth", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isSeAdmin: false,
    });

    const res = await PATCH(req({ action: "approve" }), params);
    expect(res.status).toBe(401);
  });

  it("rejects already reviewed requests", async () => {
    mockPhotoUploadRequestFindUnique.mockResolvedValue(
      requestRecord({ status: "approved" }),
    );

    const res = await PATCH(req({ action: "approve" }), params);
    expect(res.status).toBe(409);
  });

  it("approves by creating a published photo", async () => {
    const res = await PATCH(
      req({ action: "approve", caption: "A good photo" }),
      params,
    );

    expect(res.status).toBe(200);
    expect(mockPhotoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          caption: "A good photo",
          status: "published",
          uploadedById: 7,
        }),
      }),
    );
    expect(mockPhotoUploadRequestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "approved",
          publishedPhotoId: 33,
        }),
      }),
    );
  });

  it("rejects without creating a photo", async () => {
    const res = await PATCH(req({ action: "reject" }), params);

    expect(res.status).toBe(200);
    expect(mockPhotoCreate).not.toHaveBeenCalled();
    expect(mockPhotoUploadRequestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "rejected" }),
      }),
    );
  });
});

function requestRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 22,
    status: "pending",
    originalKey: "uploads/photos/requests/originals/2026/batch-1/a.jpg",
    galleryKey: "uploads/photos/requests/gallery/2026/batch-1/a.webp",
    originalFilename: "a.jpg",
    originalMimeType: "image/jpeg",
    originalSizeBytes: 10,
    gallerySizeBytes: 10,
    caption: null,
    altText: null,
    category: "general",
    eventId: null,
    exifTakenAt: null,
    manualTakenAt: null,
    batchId: "batch-1",
    ...overrides,
  };
}
