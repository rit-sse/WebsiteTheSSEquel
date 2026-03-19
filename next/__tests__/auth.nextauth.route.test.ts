import { describe, expect, it, vi } from "vitest";

const { mockNextAuth, mockAuthHandler } = vi.hoisted(() => ({
  mockAuthHandler: vi.fn(),
  mockNextAuth: vi.fn(() => mockAuthHandler),
}));

vi.mock("next-auth", () => ({
  default: mockNextAuth,
}));

vi.mock("@/lib/authOptions", () => ({
  authOptions: { providers: [] },
}));

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

describe("/api/auth/[...nextauth] route", () => {
  it("exports the same NextAuth handler for GET and POST", () => {
    expect(mockNextAuth).toHaveBeenCalledTimes(1);
    expect(GET).toBe(POST);
    expect(GET).toBe(mockAuthHandler);
  });
});
