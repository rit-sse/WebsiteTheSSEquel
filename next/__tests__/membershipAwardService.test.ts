import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, configured, sendEmail } = vi.hoisted(() => ({
  db: {
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    pendingMembershipAward: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    memberships: { create: vi.fn(), findUnique: vi.fn() },
  },
  configured: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ default: db }));
vi.mock("@/lib/email", () => ({ isEmailConfigured: configured, sendEmail }));

import {
  claimPendingMembershipAwards,
  createEmailMembershipAward,
  sendMembershipAwardEmail,
} from "@/lib/services/membershipAwardService";

const award = {
  id: "b2b32169-f454-4ab2-a171-e3dd1a5588b4",
  email: "new@g.rit.edu",
  reason: "Volunteer Work" as const,
  dateGiven: new Date("2026-03-01T00:00:00Z"),
  term: "SPRING",
  year: 2026,
  awardedById: 5,
  claimedAt: null,
  cancelledAt: null,
  emailStatus: "PENDING",
};
const input = {
  awardId: award.id,
  email: award.email,
  reason: award.reason,
  dateGiven: "2026-03-01",
};

beforeEach(() => {
  vi.resetAllMocks();
  db.$transaction.mockImplementation((callback) => callback(db));
  db.user.findUnique.mockResolvedValue({ email: award.email });
  db.user.findFirst.mockResolvedValue(null);
  db.pendingMembershipAward.findUnique.mockResolvedValue(null);
  db.pendingMembershipAward.findUniqueOrThrow.mockResolvedValue(award);
  db.pendingMembershipAward.create.mockResolvedValue(award);
  db.pendingMembershipAward.findMany.mockResolvedValue([award]);
  db.pendingMembershipAward.updateMany.mockResolvedValue({ count: 1 });
  db.memberships.findUnique.mockResolvedValue(null);
  configured.mockReturnValue(true);
});

describe("membership award creation", () => {
  it("uses the earned calendar date for term boundaries in the server timezone", async () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      await createEmailMembershipAward(
        { ...input, dateGiven: "2026-06-01" },
        5
      );
      expect(db.pendingMembershipAward.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ term: "FALL", year: 2026 }),
      });
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = previousTimezone;
    }
  });
  it("stores credit without creating an account or membership for an unknown email", async () => {
    const result = await createEmailMembershipAward(input, 5);
    expect(result).toEqual({ award, membership: null });
    expect(db.pendingMembershipAward.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: award.email,
        reason: award.reason,
        dateGiven: award.dateGiven,
        term: "SPRING",
        year: 2026,
        awardedById: 5,
      }),
    });
    expect(db.memberships.create).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it("claims immediately for an existing account with a case-insensitive match", async () => {
    db.user.findFirst.mockResolvedValue({ id: 42 });
    await createEmailMembershipAward(input, 5);
    expect(db.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: award.email, mode: "insensitive" } },
      select: { id: true },
    });
    expect(db.memberships.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 42, pendingAwardId: award.id }),
    });
  });
  it("reuses an unchanged save request instead of inserting another award", async () => {
    db.pendingMembershipAward.findUnique.mockResolvedValue(award);
    await createEmailMembershipAward(input, 5);
    expect(db.pendingMembershipAward.create).not.toHaveBeenCalled();
  });
  it("rejects reusing a request ID for different award details or another officer", async () => {
    db.pendingMembershipAward.findUnique.mockResolvedValue(award);
    await expect(
      createEmailMembershipAward({ ...input, reason: "Donation" }, 5)
    ).rejects.toMatchObject({ status: 409 });
    await expect(createEmailMembershipAward(input, 9)).rejects.toMatchObject({
      status: 409,
    });
  });
  it("never revives a cancelled award on retry", async () => {
    db.pendingMembershipAward.findUnique.mockResolvedValue({
      ...award,
      cancelledAt: new Date(),
    });
    await expect(createEmailMembershipAward(input, 5)).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe("claiming pending membership awards", () => {
  it("preserves original award details across terms and claims multiple awards", async () => {
    const second = {
      ...award,
      id: "second",
      term: "FALL",
      year: 2025,
      reason: "Donation",
    };
    db.pendingMembershipAward.findMany.mockResolvedValue([award, second]);
    await claimPendingMembershipAwards(42, " NEW@G.RIT.EDU ");
    expect(db.pendingMembershipAward.findMany).toHaveBeenCalledWith({
      where: { email: award.email, claimedAt: null, cancelledAt: null },
    });
    expect(db.memberships.create).toHaveBeenNthCalledWith(1, {
      data: {
        userId: 42,
        reason: award.reason,
        dateGiven: award.dateGiven,
        term: "SPRING",
        year: 2026,
        pendingAwardId: award.id,
      },
    });
    expect(db.memberships.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        reason: "Donation",
        term: "FALL",
        year: 2025,
        pendingAwardId: "second",
      }),
    });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      db.pendingMembershipAward.findMany.mock.invocationCallOrder[0]
    );
  });
  it("does not create a membership if another operation already claimed or cancelled it", async () => {
    db.pendingMembershipAward.updateMany.mockResolvedValue({ count: 0 });
    await claimPendingMembershipAwards(42, award.email);
    expect(db.memberships.create).not.toHaveBeenCalled();
  });
  it("propagates membership creation errors to the transaction caller", async () => {
    db.memberships.create.mockRejectedValue(new Error("database unavailable"));
    await expect(claimPendingMembershipAwards(42, award.email)).rejects.toThrow(
      "database unavailable"
    );
  });
  it("refuses to claim for a user whose stored email differs", async () => {
    db.user.findUnique.mockResolvedValue({ email: "different@g.rit.edu" });
    await claimPendingMembershipAwards(42, award.email);
    expect(db.pendingMembershipAward.findMany).not.toHaveBeenCalled();
  });
  it("ignores addresses outside the supported domain", async () => {
    await claimPendingMembershipAwards(42, "new@rit.edu");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("membership invitation delivery", () => {
  it("sends a sign-in link without creating another award or membership", async () => {
    expect(
      await sendMembershipAwardEmail(award.id, "https://sse.example")
    ).toMatchObject({ emailStatus: "SENT" });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: award.email,
        text: expect.stringContaining(
          "https://sse.example/memberships/claim?email=new%40g.rit.edu"
        ),
      })
    );
    expect(db.memberships.create).not.toHaveBeenCalled();
    expect(db.pendingMembershipAward.create).not.toHaveBeenCalled();
  });
  it("records unconfigured email as failed while retaining the award", async () => {
    configured.mockReturnValue(false);
    expect(
      await sendMembershipAwardEmail(award.id, "https://sse.example")
    ).toMatchObject({
      emailStatus: "FAILED",
      message: expect.stringContaining("not configured"),
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(db.pendingMembershipAward.update).toHaveBeenCalledWith({
      where: { id: award.id },
      data: { emailStatus: "FAILED" },
    });
  });
  it("retains the award after SMTP failure", async () => {
    sendEmail.mockRejectedValue(new Error("SMTP failed"));
    expect(
      await sendMembershipAwardEmail(award.id, "https://sse.example")
    ).toMatchObject({ emailStatus: "FAILED" });
    expect(db.pendingMembershipAward.update).toHaveBeenCalledWith({
      where: { id: award.id },
      data: { emailStatus: "FAILED" },
    });
  });
  it("returns the membership if sign-in claimed the award before email delivery", async () => {
    const membership = {
      id: 12,
      userId: 42,
      reason: award.reason,
      dateGiven: award.dateGiven,
    };
    db.pendingMembershipAward.updateMany.mockResolvedValue({ count: 0 });
    db.memberships.findUnique.mockResolvedValue(membership);

    expect(
      await sendMembershipAwardEmail(award.id, "https://sse.example")
    ).toEqual({ membership, message: "Membership already awarded." });
    expect(db.memberships.findUnique).toHaveBeenCalledWith({
      where: { pendingAwardId: award.id },
      select: { id: true, userId: true, reason: true, dateGiven: true },
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(db.memberships.create).not.toHaveBeenCalled();
    expect(db.pendingMembershipAward.update).not.toHaveBeenCalled();
  });

  it("rejects cancelled or recently attempted delivery without a claimed membership", async () => {
    db.pendingMembershipAward.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      sendMembershipAwardEmail(award.id, "https://sse.example")
    ).rejects.toMatchObject({ status: 409 });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
