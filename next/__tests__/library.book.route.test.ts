import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockResolveAuthLevelFromRequest,
  mockTextbooksFindFirst,
  mockTextbooksFindUnique,
  mockTextbooksCreate,
  mockTextbooksUpsert,
  mockTextbooksDelete,
  mockCopiesCount,
  mockCopiesDeleteMany,
  mockS3DeleteObject,
} = vi.hoisted(() => ({
  mockResolveAuthLevelFromRequest: vi.fn(),
  mockTextbooksFindFirst: vi.fn(),
  mockTextbooksFindUnique: vi.fn(),
  mockTextbooksCreate: vi.fn(),
  mockTextbooksUpsert: vi.fn(),
  mockTextbooksDelete: vi.fn(),
  mockCopiesCount: vi.fn(),
  mockCopiesDeleteMany: vi.fn(),
  mockS3DeleteObject: vi.fn(),
}));

vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevelFromRequest,
}));

vi.mock("@/lib/services/s3Service", () => ({
  s3Service: {
    deleteObject: mockS3DeleteObject,
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    textbooks: {
      findFirst: mockTextbooksFindFirst,
      findUnique: mockTextbooksFindUnique,
      create: mockTextbooksCreate,
      upsert: mockTextbooksUpsert,
      delete: mockTextbooksDelete,
    },
    textbookCopies: {
      count: mockCopiesCount,
      deleteMany: mockCopiesDeleteMany,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/library/book/route";

function req(url: string) {
  return { nextUrl: new URL(url) } as any;
}

describe("/api/library/book route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAuthLevelFromRequest.mockResolvedValue({ isOfficer: false, isMentor: false });
    mockS3DeleteObject.mockResolvedValue(undefined);
  });

  it("GET returns 404 when isbn/id query is missing", async () => {
    const res = await GET(req("http://localhost/api/library/book"));
    expect(res.status).toBe(404);
  });

  it("GET returns book with stock and overall counts when count=true", async () => {
    mockTextbooksFindFirst.mockResolvedValue({ ISBN: "123", name: "Book", image: "/library-assets/123.jpg", imageKey: null });
    mockCopiesCount.mockResolvedValueOnce(2).mockResolvedValueOnce(5);

    const res = await GET(req("http://localhost/api/library/book?isbn=123&count=true"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      ISBN: "123",
      stockNumber: 2,
      overallCount: 5,
    });
  });

  it("POST denies unauthorized users", async () => {
    const request = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const res = await POST(request);
    expect(res.status).toBe(401);
  });

  it("PUT validates ISBN format", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({ isOfficer: true, isMentor: false });
    const request = {
      json: vi.fn().mockResolvedValue({ ISBN: "bad_isbn", name: "Book", authors: "A" }),
    } as any;

    const res = await PUT(request);
    expect(res.status).toBe(400);
  });

  it("DELETE validates ISBN format", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({ isOfficer: true, isMentor: false });
    const request = {
      json: vi.fn().mockResolvedValue({ ISBN: "bad_isbn" }),
    } as any;

    const res = await DELETE(request);
    expect(res.status).toBe(400);
  });

  it("DELETE cleans up S3 image when book has imageKey", async () => {
    mockResolveAuthLevelFromRequest.mockResolvedValue({ isOfficer: true, isMentor: false });
    mockTextbooksFindUnique.mockResolvedValue({ imageKey: "uploads/library-books/123-4/cover.jpg" });
    mockCopiesDeleteMany.mockResolvedValue({ count: 0 });
    mockTextbooksDelete.mockResolvedValue({});

    const request = {
      json: vi.fn().mockResolvedValue({ ISBN: "123-4" }),
    } as any;

    const res = await DELETE(request);
    expect(res.status).toBe(200);
    expect(mockS3DeleteObject).toHaveBeenCalledWith("uploads/library-books/123-4/cover.jpg");
  });
});
