import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { auth, findMany, updateMany, sendEmail } = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
  sendEmail: vi.fn(),
}));
vi.mock("@/lib/authGateway", () => ({ getGatewayAuthLevel: auth }));
vi.mock("@/lib/prisma", () => ({
  default: { pendingMembershipAward: { findMany, updateMany } },
}));
vi.mock("@/lib/baseUrl", () => ({
  getPublicBaseUrl: () => "https://sse.example",
}));
vi.mock("@/lib/services/membershipAwardService", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/services/membershipAwardService")
  >()),
  sendMembershipAwardEmail: sendEmail,
}));

import { GET, POST, DELETE } from "@/app/api/memberships/pending/route";

const awardId = "b2b32169-f454-4ab2-a171-e3dd1a5588b4";
function request(method: string, body: unknown = { awardId }) {
  return new NextRequest("https://sse.example/api/memberships/pending", {
    method,
    ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  auth.mockResolvedValue({ userId: 5, isOfficer: true });
});

describe("pending membership award management", () => {
  it.each([GET, POST, DELETE])(
    "rejects signed-out requests even when staging reports officer access",
    async (handler) => {
      auth.mockResolvedValue({ userId: null, isUser: false, isOfficer: true });
      expect((await handler(request("POST"))).status).toBe(401);
      expect(findMany).not.toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    }
  );
  it.each([GET, POST, DELETE])(
    "denies anonymous and non-officer access",
    async (handler) => {
      auth.mockResolvedValueOnce({ userId: null, isOfficer: false });
      expect((await handler(request("POST"))).status).toBe(401);
      auth.mockResolvedValueOnce({ userId: 6, isOfficer: false });
      expect((await handler(request("POST"))).status).toBe(403);
      expect(findMany).not.toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    }
  );
  it("lists only unclaimed and uncancelled awards", async () => {
    findMany.mockResolvedValue([{ id: awardId }]);
    expect(await (await GET(request("GET"))).json()).toEqual([{ id: awardId }]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { claimedAt: null, cancelledAt: null } })
    );
  });
  it("retries delivery for the saved award", async () => {
    sendEmail.mockResolvedValue({ emailStatus: "SENT" });
    expect(await (await POST(request("POST"))).json()).toEqual({
      emailStatus: "SENT",
    });
    expect(sendEmail).toHaveBeenCalledWith(awardId, "https://sse.example");
  });
  it("cancels only an award that is still pending", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    expect((await DELETE(request("DELETE"))).status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: awardId, claimedAt: null, cancelledAt: null },
      data: { cancelledAt: expect.any(Date) },
    });
  });
  it("reports a conflict if claiming won the race with cancellation", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    expect((await DELETE(request("DELETE"))).status).toBe(409);
  });
  it.each([POST, DELETE])("rejects malformed actions", async (handler) => {
    expect(
      (await handler(request("POST", { awardId: "invalid" }))).status
    ).toBe(400);
  });
});
