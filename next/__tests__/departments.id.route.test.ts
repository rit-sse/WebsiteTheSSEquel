import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    department: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/departments/[id]/route";

describe("/api/departments/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns department when found", async () => {
    mockFindUnique.mockResolvedValue({ title: "Software", shortTitle: "SWEN" });

    const res = await GET(new Request("http://localhost/api/departments/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ title: "Software", shortTitle: "SWEN" });
  });

  it("returns 404 for missing department", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/departments/404"), {
      params: Promise.resolve({ id: "404" }),
    });

    expect(res.status).toBe(404);
  });
});
