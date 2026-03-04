import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    projectContributor: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/projectContributor/[id]/route";

describe("/api/projectContributor/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns contributor details when found", async () => {
    mockFindUnique.mockResolvedValue({
      id: 5,
      user: { id: 1, name: "Alex", email: "alex@g.rit.edu" },
      project: { id: 10, title: "Portal" },
    });

    const res = await GET(new Request("http://localhost/api/projectContributor/5"), {
      params: Promise.resolve({ id: "5" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: 5,
      user: { id: 1, name: "Alex", email: "alex@g.rit.edu" },
      project: { id: 10, title: "Portal" },
    });
  });

  it("returns not-found message when contributor is missing", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/projectContributor/99"), {
      params: Promise.resolve({ id: "99" }),
    });

    expect(await res.text()).toContain("project of 'id' 99 doesn't exist");
  });
});
