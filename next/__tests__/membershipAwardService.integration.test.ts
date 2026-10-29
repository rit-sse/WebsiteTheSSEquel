import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Set MEMBERSHIP_AWARD_TEST_DATABASE_URL to a disposable, migrated database.
// These tests create and delete fixtures; they never use DATABASE_URL.
vi.mock("@/lib/prisma", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return {
    default: new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.MEMBERSHIP_AWARD_TEST_DATABASE_URL ??
            "postgresql://unused/unused",
        },
      },
    }),
  };
});
vi.mock("@/lib/email", () => ({
  isEmailConfigured: () => false,
  sendEmail: vi.fn(),
}));

import prisma from "@/lib/prisma";
import {
  claimPendingMembershipAwards,
  createEmailMembershipAward,
} from "@/lib/services/membershipAwardService";

describe.skipIf(!process.env.MEMBERSHIP_AWARD_TEST_DATABASE_URL)(
  "membership awards against PostgreSQL",
  () => {
    let officerId: number;
    const userIds: number[] = [];
    const prefix = `award-test-${randomUUID()}`;
    const email = (suffix: string) => `${prefix}-${suffix}@g.rit.edu`;
    const input = (recipient: string) => ({
      awardId: randomUUID(),
      email: recipient,
      reason: "Volunteer Work" as const,
      dateGiven: "2025-10-26",
    });
    async function createUser(recipient: string) {
      const user = await prisma.user.create({
        data: { email: recipient, name: "Membership award test" },
      });
      userIds.push(user.id);
      return user;
    }

    beforeAll(async () => {
      officerId = (await createUser(email("officer"))).id;
    });
    afterAll(async () => {
      await prisma.memberships.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.pendingMembershipAward.deleteMany({
        where: { email: { startsWith: prefix } },
      });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.$disconnect();
    });

    it("claims multiple awards once under simultaneous sign-ins and repeated saves", async () => {
      const recipient = email("parallel");
      const first = input(recipient);
      const second = input(recipient);
      await Promise.all([
        createEmailMembershipAward(first, officerId),
        createEmailMembershipAward(first, officerId),
        createEmailMembershipAward(second, officerId),
      ]);
      expect(await prisma.user.count({ where: { email: recipient } })).toBe(0);
      const user = await createUser(recipient);
      await Promise.all(
        Array.from({ length: 4 }, () =>
          claimPendingMembershipAwards(user.id, recipient)
        )
      );
      const memberships = await prisma.memberships.findMany({
        where: { userId: user.id },
      });
      expect(memberships).toHaveLength(2);
      expect(
        new Set(memberships.map((value) => value.pendingAwardId)).size
      ).toBe(2);
      expect(memberships[0]).toMatchObject({
        reason: "Volunteer Work",
        dateGiven: new Date("2025-10-26T00:00:00Z"),
        term: "FALL",
        year: 2025,
      });
      await createEmailMembershipAward(first, officerId);
      expect(
        await prisma.memberships.count({ where: { userId: user.id } })
      ).toBe(2);
    });

    it("does not strand an award created concurrently with first sign-in", async () => {
      const recipient = email("new-user");
      const award = input(recipient);
      await Promise.all([
        createEmailMembershipAward(award, officerId),
        (async () => {
          const user = await createUser(recipient);
          await claimPendingMembershipAwards(user.id, recipient);
        })(),
      ]);
      expect(
        await prisma.memberships.count({
          where: { pendingAwardId: award.awardId },
        })
      ).toBe(1);
      expect(
        await prisma.pendingMembershipAward.count({
          where: { id: award.awardId, claimedAt: null },
        })
      ).toBe(0);
    });

    it("either cancels or claims when cancellation races with sign-in", async () => {
      const recipient = email("cancel");
      const award = input(recipient);
      await createEmailMembershipAward(award, officerId);
      const user = await createUser(recipient);
      await Promise.all([
        claimPendingMembershipAwards(user.id, recipient),
        prisma.pendingMembershipAward.updateMany({
          where: { id: award.awardId, claimedAt: null, cancelledAt: null },
          data: { cancelledAt: new Date() },
        }),
      ]);
      const saved = await prisma.pendingMembershipAward.findUniqueOrThrow({
        where: { id: award.awardId },
      });
      const count = await prisma.memberships.count({
        where: { pendingAwardId: award.awardId },
      });
      expect(Boolean(saved.claimedAt)).not.toBe(Boolean(saved.cancelledAt));
      expect(count).toBe(saved.claimedAt ? 1 : 0);
    });

    it("enforces the unique award-to-membership reference in the database", async () => {
      const user = await createUser(email("unique"));
      const award = input(user.email);
      await createEmailMembershipAward(award, officerId);
      await expect(
        prisma.memberships.create({
          data: {
            userId: user.id,
            pendingAwardId: award.awardId,
            reason: "Duplicate",
            dateGiven: new Date(),
            term: "FALL",
            year: 2026,
          },
        })
      ).rejects.toMatchObject({ code: "P2002" });
    });
  }
);
