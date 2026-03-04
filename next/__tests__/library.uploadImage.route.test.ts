import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetAuth, mockWriteFileSync } = vi.hoisted(() => ({
  mockGetAuth: vi.fn(),
  mockWriteFileSync: vi.fn(),
}));

vi.mock("@/app/api/library/authTools", () => ({
  getAuth: mockGetAuth,
  getSessionCookie: vi.fn(),
}));

vi.mock("fs", () => ({
  writeFileSync: mockWriteFileSync,
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

import { POST, PUT } from "@/app/api/library/uploadImage/route";

function req(body: unknown, cookie: string | null = "token") {
  return {
    json: vi.fn().mockResolvedValue(body),
    cookies: {
      get: vi.fn(() => (cookie ? { value: cookie } : undefined)),
    },
  } as any;
}

describe("/api/library/uploadImage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockResolvedValue({ isOfficer: false, isMentor: false });
  });

  it("POST requires session cookie", async () => {
    const res = await POST(req({}, null));
    expect(res.status).toBe(401);
  });

  it("POST validates imageData", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });

    const res = await POST(req({ ISBN: "123-4" }));
    expect(res.status).toBe(400);
  });

  it("PUT requires ISBN", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });

    const res = await PUT(req({ imageData: "data:image/png;base64,AAAA" }));
    expect(res.status).toBe(400);
  });

  it("PUT uploads image for valid payload", async () => {
    mockGetAuth.mockResolvedValue({ isOfficer: true, isMentor: false });

    const res = await PUT(req({
      imageData: "data:image/png;base64,QUJDRA==",
      ISBN: "123-4",
    }));

    expect(res.status).toBe(200);
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(await res.json()).toEqual({
      message: "Image uploaded successfully",
      imageUrl: "/library-assets/123-4.jpg",
    });
  });
});
