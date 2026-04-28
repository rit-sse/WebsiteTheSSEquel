import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEventFindUnique } = vi.hoisted(() => ({
  mockEventFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      findUnique: mockEventFindUnique,
    },
  },
}));

import { GET } from "@/app/api/event/[id]/route";

describe("/api/event/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when event is not found", async () => {
    mockEventFindUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "evt-missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns event when found", async () => {
    mockEventFindUnique.mockResolvedValue({ id: "evt-1", title: "Event 1" });
    const res = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "evt-1", title: "Event 1" });
  });
});
