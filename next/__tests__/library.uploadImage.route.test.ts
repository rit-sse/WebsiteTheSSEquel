import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetAuth,
  mockPutObject,
  mockTextbooksUpdate,
  mockTextbooksFindUnique,
} = vi.hoisted(() => ({
  mockGetAuth: vi.fn(),
  mockPutObject: vi.fn(),
  mockTextbooksUpdate: vi.fn(),
  mockTextbooksFindUnique: vi.fn(),
}));

vi.mock("@/app/api/library/authTools", () => ({
  getAuth: mockGetAuth,
  getSessionCookie: vi.fn(),
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
      update: mockTextbooksUpdate,
      findUnique: mockTextbooksFindUnique,
    },
  },
}));

import { POST, PUT } from "@/app/api/library/uploadImage/route";

function req(body: unknown, cookie: string | null = "token") {
  return {
    json: vi.fn().mockResolvedValue(body),
    cookies: {
      get: vi.fn(() => (cookie ? { value: cookie } : undefined)),
    },
  } as any;
}

describe("/api/library/uploadImage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockResolvedValue({ isOfficer: false, isMentor: false });
    mockPutObject.mockResolvedValue(undefined);
    mockTextbooksUpdate.mockResolvedValue({});
    mockTextbooksFindUnique.mockResolvedValue({ imageKey: null });
  });

  it("POST requires session cookie", async () => {
    const res = await POST(req({}, null));
    expect(res.status).toBe(401);
  });

  it("POST validates imageData", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });

    const res = await POST(req({ ISBN: "123-4" }));
    expect(res.status).toBe(400);
  });

  it("PUT requires ISBN", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });

    const res = await PUT(req({ imageData: "data:image/png;base64,AAAA" }));
    expect(res.status).toBe(400);
  });

  it("PUT uploads image to S3 for valid payload", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });

    const res = await PUT(
      req({
        imageData: "data:image/png;base64,QUJDRA==",
        ISBN: "123-4",
      })
    );

    expect(res.status).toBe(200);
    expect(mockPutObject).toHaveBeenCalledWith(
      expect.stringContaining("uploads/library-books/123-4/"),
      expect.any(Uint8Array),
      "image/png"
    );
    expect(mockTextbooksUpdate).toHaveBeenCalled();

    const body = await res.json();
    expect(body.message).toBe("Image uploaded successfully");
    expect(body.key).toMatch(/^uploads\/library-books\/123-4\//);
    expect(body.imageUrl).toMatch(/\/api\/aws\/image\?key=/);
  });
});
