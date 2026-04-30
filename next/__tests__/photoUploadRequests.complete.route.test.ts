import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeadObject, mockEventFindUnique, mockPhotoUploadRequestCreate } =
  vi.hoisted(() => ({
    mockHeadObject: vi.fn(),
    mockEventFindUnique: vi.fn(),
    mockPhotoUploadRequestCreate: vi.fn(),
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
    photoUploadRequest: {
      create: mockPhotoUploadRequestCreate,
    },
  },
}));

import { POST } from "@/app/api/photo-upload-requests/batches/[batchId]/complete/route";

function req(body: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers({ "x-forwarded-for": "203.0.113.1" }),
  } as any;
}

const params = { params: Promise.resolve({ batchId: "batch-1" }) };

describe("/api/photo-upload-requests/batches/[batchId]/complete route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
    mockHeadObject.mockImplementation((key: string) =>
      Promise.resolve({
        contentType: key.endsWith(".webp") ? "image/webp" : "image/jpeg",
        contentLength: 10,
      }),
    );
    mockEventFindUnique.mockResolvedValue({ id: "event-1" });
    mockPhotoUploadRequestCreate.mockResolvedValue({ id: 12 });
  });

  it("rejects invalid request tokens", async () => {
    const res = await POST(
      req({ requestToken: "bad", photos: [photoInput()] }),
      params,
    );

    expect(res.status).toBe(400);
    expect(mockPhotoUploadRequestCreate).not.toHaveBeenCalled();
  });

  it("rejects honeypot submissions", async () => {
    const res = await POST(
      req({
        requestToken: signedToken("batch-1"),
        website: "https://spam.example",
        photos: [photoInput()],
      }),
      params,
    );

    expect(res.status).toBe(400);
  });

  it("rejects over-limit completion payloads", async () => {
    const res = await POST(
      req({
        requestToken: signedToken("batch-1"),
        photos: Array.from({ length: 21 }, (_, index) =>
          photoInput({
            clientId: `client-${index}`,
            originalKey: `uploads/photos/requests/originals/2026/batch-1/${index}.jpg`,
            galleryKey: `uploads/photos/requests/gallery/2026/batch-1/${index}.webp`,
          }),
        ),
      }),
      params,
    );

    expect(res.status).toBe(400);
    expect(mockPhotoUploadRequestCreate).not.toHaveBeenCalled();
  });

  it("creates pending upload requests, not published photos", async () => {
    const res = await POST(
      req({
        requestToken: signedToken("batch-1"),
        submitterEmail: "alum@example.com",
        photos: [photoInput()],
      }),
      params,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.created).toEqual([{ id: 12, clientId: "client-1" }]);
    expect(mockPhotoUploadRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "pending",
          submitterEmail: "alum@example.com",
        }),
      }),
    );
  });
});

function signedToken(batchId: string) {
  return `${batchId}.${createHmac("sha256", "test-secret")
    .update(batchId)
    .digest("hex")}`;
}

function photoInput(overrides: Record<string, unknown> = {}) {
  return {
    clientId: "client-1",
    originalKey: "uploads/photos/requests/originals/2026/batch-1/a.jpg",
    galleryKey: "uploads/photos/requests/gallery/2026/batch-1/a.webp",
    originalFilename: "a.jpg",
    originalMimeType: "image/jpeg",
    originalSizeBytes: 10,
    galleryMimeType: "image/webp",
    gallerySizeBytes: 10,
    ...overrides,
  };
}
