import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveAuthLevelFromRequest,
  mockHeadObject,
  mockEventFindUnique,
  mockPhotoCreate,
} = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
  mockHeadObject: vi.fn(),
  mockEventFindUnique: vi.fn(),
  mockPhotoCreate: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    headObject: mockHeadObject,
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      findUnique: mockEventFindUnique,
    },
    photo: {
      create: mockPhotoCreate,
    },
  },
}));

import { POST } from "@/app/api/photos/batches/[batchId]/complete/route";

function req(body: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

const params = { params: Promise.resolve({ batchId: "batch-1" }) };

describe("/api/photos/batches/[batchId]/complete route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: true,
      isSeAdmin: false,
      userId: 7,
    });
    mockHeadObject.mockResolvedValue({});
    mockEventFindUnique.mockResolvedValue({ id: "event-1" });
    mockPhotoCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: 1, ...data, event: null })
    );
  });

  it("requires officer auth", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isSeAdmin: false,
    });

    const res = await POST(req({ photos: [] }), params);
    expect(res.status).toBe(401);
  });

  it("validates event existence", async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const res = await POST(
      req({ eventId: "missing", photos: [photoInput()] }),
      params
    );

    expect(res.status).toBe(400);
  });

  it("uses EXIF date before manual date", async () => {
    await POST(
      req({
        batchManualTakenAt: "2026-01-01",
        photos: [
          photoInput({
            exifTakenAt: "2026-02-03T00:00:00.000Z",
            manualTakenAt: "2026-02-01",
          }),
        ],
      }),
      params
    );

    expect(mockPhotoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sortDate: new Date("2026-02-03T00:00:00.000Z"),
        }),
      })
    );
  });

  it("falls back to manual date when EXIF is missing", async () => {
    await POST(
      req({
        batchManualTakenAt: "2026-01-01",
        photos: [photoInput({ manualTakenAt: "2026-02-01" })],
      }),
      params
    );

    expect(mockPhotoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sortDate: new Date("2026-02-01T00:00:00.000Z"),
        }),
      })
    );
  });

  it("reports missing S3 objects as file failures", async () => {
    const error = new Error("missing");
    error.name = "NoSuchKey";
    mockHeadObject.mockRejectedValue(error);

    const res = await POST(req({ photos: [photoInput()] }), params);
    const body = await res.json();

    expect(body.created).toEqual([]);
    expect(body.failed[0].error).toBe("Uploaded object was not found in S3");
  });
});

function photoInput(overrides: Record<string, unknown> = {}) {
  return {
    clientId: "client-1",
    originalKey: "uploads/photos/originals/2026/batch-1/a.jpg",
    galleryKey: "uploads/photos/gallery/2026/batch-1/a.webp",
    originalFilename: "a.jpg",
    originalMimeType: "image/jpeg",
    originalSizeBytes: 10,
    galleryMimeType: "image/webp",
    gallerySizeBytes: 10,
    ...overrides,
  };
}
