import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    project: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/project/[id]/route";

describe("/api/project/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns project when found", async () => {
    mockFindUnique.mockResolvedValue({ id: 1, title: "Project One" });

    const res = await GET(new Request("http://localhost/api/project/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, title: "Project One" });
  });

  it("returns not-found message when project is missing", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/project/42"), {
      params: Promise.resolve({ id: "42" }),
    });

    expect(await res.text()).toContain("project of 'id' 42 doesn't exist");
  });
});
