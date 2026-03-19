import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockFindFirst } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    goLinks: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
    },
  },
}));

import { GET as publicGET } from "@/app/api/golinks/public/route";
import { GET as officerGET } from "@/app/api/golinks/officer/route";
import { GET as goGET } from "@/app/api/go/[golink]/route";

describe("golinks read routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("public route returns only public links", async () => {
    mockFindMany.mockResolvedValue([{ id: 1, isPublic: true }]);
    const res = await publicGET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, isPublic: true }]);
  });

  it("officer route returns officer-only links", async () => {
    mockFindMany.mockResolvedValue([{ id: 2, isPublic: false }]);
    const res = await officerGET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 2, isPublic: false }]);
  });

  it("/api/go/[golink] returns plain redirect url when found", async () => {
    mockFindFirst.mockResolvedValue({ url: "https://example.com" });
    const res = await goGET(new Request("http://localhost") as any, {
      params: Promise.resolve({ golink: "abc" }),
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("https://example.com");
  });

  it("/api/go/[golink] returns invalid message when missing", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await goGET(new Request("http://localhost") as any, {
      params: Promise.resolve({ golink: "missing" }),
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Invalid golink");
  });
});
