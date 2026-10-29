import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockResolveAuthLevel, mockModel } = vi.hoisted(() => ({
  mockResolveAuthLevel: vi.fn(),
  mockModel: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the resolver underneath getGatewayAuthLevel so the real
// requireOfficer() check in each handler is exercised.
vi.mock("@/lib/authLevelResolver", () => ({
  resolveAuthLevelFromRequest: mockResolveAuthLevel,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    sponsorshipInquiry: mockModel,
    recruitingTalkRequest: mockModel,
    viseTalkRequest: mockModel,
  },
}));

import * as sponsorshipInquiries from "@/app/api/sponsorship-inquiries/route";
import * as recruitingTalkRequests from "@/app/api/recruiting-talk-requests/route";
import * as viseTalkRequests from "@/app/api/vise-talk-requests/route";

const ANONYMOUS = { isUser: false, isOfficer: false, isSeAdmin: false };
const MEMBER = { userId: 7, isUser: true, isOfficer: false, isSeAdmin: false };
const OFFICER = { userId: 1, isUser: true, isOfficer: true, isSeAdmin: false };

function jsonRequest(path: string, method: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe.each([
  ["/api/sponsorship-inquiries", sponsorshipInquiries],
  ["/api/recruiting-talk-requests", recruitingTalkRequests],
  ["/api/vise-talk-requests", viseTalkRequests],
])("%s", (path, route) => {
  const calls = {
    GET: () => route.GET(jsonRequest(path, "GET")),
    PUT: () =>
      route.PUT(jsonRequest(path, "PUT", { id: 1, status: "pending" })),
    DELETE: () => route.DELETE(jsonRequest(path, "DELETE", { id: 1 })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockModel.findMany.mockResolvedValue([
      { id: 1, contactEmail: "recruiter@company.com" },
    ]);
    mockModel.findUnique.mockResolvedValue({ id: 1 });
    mockModel.update.mockResolvedValue({ id: 1 });
    mockModel.delete.mockResolvedValue({ id: 1 });
  });

  it.each(["GET", "PUT", "DELETE"] as const)(
    "%s returns 401 for anonymous callers without touching the database",
    async (method) => {
      mockResolveAuthLevel.mockResolvedValue(ANONYMOUS);
      const res = await calls[method]();
      expect(res.status).toBe(401);
      for (const fn of Object.values(mockModel)) {
        expect(fn).not.toHaveBeenCalled();
      }
    }
  );

  it.each(["GET", "PUT", "DELETE"] as const)(
    "%s returns 403 for signed-in non-officers",
    async (method) => {
      mockResolveAuthLevel.mockResolvedValue(MEMBER);
      const res = await calls[method]();
      expect(res.status).toBe(403);
      for (const fn of Object.values(mockModel)) {
        expect(fn).not.toHaveBeenCalled();
      }
    }
  );

  it("GET returns submissions to officers", async () => {
    mockResolveAuthLevel.mockResolvedValue(OFFICER);
    const res = await calls.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 1, contactEmail: "recruiter@company.com" },
    ]);
  });

  it("DELETE removes a submission for officers", async () => {
    mockResolveAuthLevel.mockResolvedValue(OFFICER);
    const res = await calls.DELETE();
    expect(res.status).toBe(200);
    expect(mockModel.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("POST stays open to anonymous submitters", async () => {
    mockResolveAuthLevel.mockResolvedValue(ANONYMOUS);
    // An empty body fails validation, which proves the auth gate was skipped.
    const res = await route.POST(jsonRequest(path, "POST", {}));
    expect(res.status).toBe(400);
    expect(mockResolveAuthLevel).not.toHaveBeenCalled();
  });
});
