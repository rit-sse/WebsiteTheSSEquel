import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCopiesFindMany, mockTextbooksFindFirst, mockTextbooksFindMany } = vi.hoisted(() => ({
  mockCopiesFindMany: vi.fn(),
  mockTextbooksFindFirst: vi.fn(),
  mockTextbooksFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    textbookCopies: {
      findMany: mockCopiesFindMany,
    },
    textbooks: {
      findFirst: mockTextbooksFindFirst,
      findMany: mockTextbooksFindMany,
    },
  },
}));

import { GET } from "@/app/api/library/books/route";

function req(url: string) {
  return { nextUrl: new URL(url) } as any;
}

describe("/api/library/books route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET by isbn returns matching copies", async () => {
    mockCopiesFindMany.mockResolvedValue([{ ISBN: "123", checkedOut: false }]);

    const res = await GET(req("http://localhost/api/library/books?isbn=123"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ ISBN: "123", checkedOut: false }]);
  });

  it("GET by id returns 404 when book does not exist", async () => {
    mockTextbooksFindFirst.mockResolvedValue(null);

    const res = await GET(req("http://localhost/api/library/books?id=999"));
    expect(res.status).toBe(404);
  });

  it("GET all returns 404 when no books exist", async () => {
    mockTextbooksFindMany.mockResolvedValue([]);

    const res = await GET(req("http://localhost/api/library/books"));
    expect(res.status).toBe(404);
  });
});
