import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveAuthLevelFromRequest,
  mockPhotoFindUnique,
  mockPhotoUpdate,
  mockPhotoDelete,
  mockEventFindUnique,
  mockDeleteObject,
} = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
  mockPhotoFindUnique: vi.fn(),
  mockPhotoUpdate: vi.fn(),
  mockPhotoDelete: vi.fn(),
  mockEventFindUnique: vi.fn(),
  mockDeleteObject: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    deleteObject: mockDeleteObject,
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      findUnique: mockEventFindUnique,
    },
    photo: {
      findUnique: mockPhotoFindUnique,
      update: mockPhotoUpdate,
      delete: mockPhotoDelete,
    },
  },
}));

import { DELETE, PATCH } from "@/app/api/photos/[id]/route";

function req(body: unknown = {}) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

const params = { params: Promise.resolve({ id: "1" }) };

describe("/api/photos/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: true,
      isSeAdmin: false,
    });
    mockEventFindUnique.mockResolvedValue({ id: "event-1" });
    mockPhotoFindUnique.mockResolvedValue({
      id: 1,
      originalKey: "uploads/photos/originals/a.jpg",
      galleryKey: "uploads/photos/gallery/a.webp",
      exifTakenAt: null,
      manualTakenAt: null,
      uploadedAt: new Date("2026-01-01T00:00:00Z"),
    });
    mockPhotoUpdate.mockResolvedValue({ id: 1 });
    mockPhotoDelete.mockResolvedValue({});
    mockDeleteObject.mockResolvedValue(undefined);
  });

  it("requires officer auth for PATCH", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({
      isOfficer: false,
      isSeAdmin: false,
    });

    const res = await PATCH(req({ caption: "new" }), params);
    expect(res.status).toBe(401);
  });

  it("recomputes sortDate when manual date changes", async () => {
    const res = await PATCH(req({ manualTakenAt: "2026-02-01" }), params);

    expect(res.status).toBe(200);
    expect(mockPhotoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          manualTakenAt: new Date("2026-02-01T00:00:00.000Z"),
          sortDate: new Date("2026-02-01T00:00:00.000Z"),
        }),
      })
    );
  });

  it("deletes both S3 objects and the DB row", async () => {
    const res = await DELETE(req(), params);

    expect(res.status).toBe(200);
    expect(mockDeleteObject).toHaveBeenCalledWith(
      "uploads/photos/originals/a.jpg"
    );
    expect(mockDeleteObject).toHaveBeenCalledWith(
      "uploads/photos/gallery/a.webp"
    );
    expect(mockPhotoDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("keeps DB row when S3 delete fails", async () => {
    mockDeleteObject.mockRejectedValue(new Error("s3 down"));

    const res = await DELETE(req(), params);

    expect(res.status).toBe(502);
    expect(mockPhotoDelete).not.toHaveBeenCalled();
  });
});
