import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetAuth,
  mockGetSessionCookie,
  mockCategoryFindMany,
  mockCategoryCreate,
  mockCategoryUpdate,
  mockCategoryDelete,
  mockTextbooksFindMany,
  mockCopiesCount,
} = vi.hoisted(() => ({
  mockGetAuth: vi.fn(),
  mockGetSessionCookie: vi.fn(),
  mockCategoryFindMany: vi.fn(),
  mockCategoryCreate: vi.fn(),
  mockCategoryUpdate: vi.fn(),
  mockCategoryDelete: vi.fn(),
  mockTextbooksFindMany: vi.fn(),
  mockCopiesCount: vi.fn(),
}));

vi.mock("@/app/api/library/authTools", () => ({
  getAuth: mockGetAuth,
  getSessionCookie: mockGetSessionCookie,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    bookCategory: {
      findMany: mockCategoryFindMany,
      create: mockCategoryCreate,
      update: mockCategoryUpdate,
      delete: mockCategoryDelete,
    },
    textbooks: {
      findMany: mockTextbooksFindMany,
    },
    textbookCopies: {
      count: mockCopiesCount,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/library/categories/route";

function req(url: string, body?: unknown) {
  return {
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/library/categories route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockResolvedValue({ isOfficer: false, isMentor: false });
  });

  it("GET returns empty object when there are no categories", async () => {
    mockCategoryFindMany.mockResolvedValue([]);

    const res = await GET(req("http://localhost/api/library/categories"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it("POST denies unauthorized users", async () => {
    const res = await POST(req("http://localhost/api/library/categories", { categoryName: "Core" }));
    expect(res.status).toBe(401);
  });

  it("PUT updates category with mapped textbook ids", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });
    mockTextbooksFindMany.mockResolvedValue([{ id: 4, ISBN: "123" }]);
    mockCategoryUpdate.mockResolvedValue({ id: 2, categoryName: "Core", books: [4] });

    const res = await PUT(
      req("http://localhost/api/library/categories", {
        id: 2,
        categoryName: "Core",
        books: ["123"],
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 2, categoryName: "Core", books: [4] });
  });

  it("DELETE denies unauthorized users", async () => {
    const res = await DELETE(req("http://localhost/api/library/categories", { id: 1 }));
    expect(res.status).toBe(401);
  });
});
