import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    textbooks: {
      findMany: mockFindMany,
    },
  },
}));

import { GET } from "@/app/api/library/search/route";

function req(url: string) {
  return { nextUrl: new URL(url) } as any;
}

describe("/api/library/search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when query is missing", async () => {
    const res = await GET(req("http://localhost/api/library/search"));
    expect(res.status).toBe(400);
  });

  it("returns matching books for valid query", async () => {
    mockFindMany.mockResolvedValue([
      {
        ISBN: "123",
        name: "Algorithms",
        image: "/library-assets/123.jpg",
        imageKey: null,
      },
    ]);

    const res = await GET(
      req("http://localhost/api/library/search?query=algo")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      ISBN: "123",
      name: "Algorithms",
      image: "/library-assets/123.jpg",
    });
  });

  it("resolves S3 image when imageKey is present", async () => {
    mockFindMany.mockResolvedValue([
      {
        ISBN: "456",
        name: "Data Structures",
        image: "",
        imageKey: "uploads/library-books/456/cover.jpg",
      },
    ]);

    const res = await GET(
      req("http://localhost/api/library/search?query=data")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].image).toContain("/api/aws/image?key=");
  });
});
