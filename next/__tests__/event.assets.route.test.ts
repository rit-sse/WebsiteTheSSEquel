import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPurchaseFindMany,
  mockEventFindUnique,
  mockGetPublicBaseUrl,
  mockQrToBuffer,
  mockQrToString,
} = vi.hoisted(() => ({
  mockPurchaseFindMany: vi.fn(),
  mockEventFindUnique: vi.fn(),
  mockGetPublicBaseUrl: vi.fn(),
  mockQrToBuffer: vi.fn(),
  mockQrToString: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    purchaseRequest: { findMany: mockPurchaseFindMany },
    event: { findUnique: mockEventFindUnique },
  },
}));

vi.mock("@/lib/baseUrl", () => ({
  getPublicBaseUrl: mockGetPublicBaseUrl,
}));

vi.mock("qrcode", () => ({
  default: {
    toBuffer: mockQrToBuffer,
    toString: mockQrToString,
  },
}));

import { GET as purchasesGET } from "@/app/api/event/[id]/purchases/route";
import { GET as qrGET } from "@/app/api/event/[id]/qr/route";
import { GET as flyerGET } from "@/app/api/event/[id]/flyer/route";

describe("/api/event/[id] asset/purchase routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublicBaseUrl.mockReturnValue("https://example.com");
  });

  it("purchases route returns list", async () => {
    mockPurchaseFindMany.mockResolvedValue([{ id: 1 }]);
    const req = new Request("http://localhost") as any;
    const res = await purchasesGET(req, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1 }]);
  });

  it("qr route returns 404 when event missing", async () => {
    mockEventFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost") as any;
    const res = await qrGET(req, {
      params: Promise.resolve({ id: "evt-missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("qr route returns png response for attendance-enabled event", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      attendanceEnabled: true,
    });
    mockQrToBuffer.mockResolvedValue(Buffer.from("png-bytes"));
    const req = new Request("http://localhost") as any;
    const res = await qrGET(req, { params: Promise.resolve({ id: "evt-1" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
  });

  it("flyer route returns 400 when attendance not enabled", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      date: "2026-03-04T12:00:00.000Z",
      location: "Lab",
      attendanceEnabled: false,
    });
    const req = new Request("http://localhost") as any;
    const res = await flyerGET(req, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    expect(res.status).toBe(400);
  });

  it("flyer route returns svg content when valid", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "Event",
      date: "2026-03-04T12:00:00.000Z",
      location: "Lab",
      attendanceEnabled: true,
    });
    mockQrToString.mockResolvedValue("<svg>qr</svg>");
    const req = new Request("http://localhost") as any;
    const res = await flyerGET(req, {
      params: Promise.resolve({ id: "evt-1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/svg+xml");
  });
});
