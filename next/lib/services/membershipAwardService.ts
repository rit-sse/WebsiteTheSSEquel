import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { normalizeMembershipDateInput } from "@/lib/membershipUtils";
import {
  emailMembershipAwardSchema,
  membershipAwardEmailSchema,
} from "./membershipAwardValidation";
export { emailMembershipAwardSchema } from "./membershipAwardValidation";
import { getCurrentSseOperationalTerm } from "@/lib/sseTerms";

export class MembershipAwardError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function lockRecipient(tx: Prisma.TransactionClient, email: string) {
  // Lock both paths so signing in while an award is being saved can't leave
  // that award pending after the account has been created.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${email}, 0))::text`;
}

async function claimAwards(
  tx: Prisma.TransactionClient,
  userId: number,
  email: string
) {
  const awards = await tx.pendingMembershipAward.findMany({
    where: { email, claimedAt: null, cancelledAt: null },
  });
  for (const award of awards) {
    const claimed = await tx.pendingMembershipAward.updateMany({
      where: { id: award.id, claimedAt: null, cancelledAt: null },
      data: { claimedAt: new Date() },
    });
    if (!claimed.count) continue;
    await tx.memberships.create({
      data: {
        userId,
        reason: award.reason,
        dateGiven: award.dateGiven,
        term: award.term,
        year: award.year,
        pendingAwardId: award.id,
      },
    });
  }
}

/** Requires a saved user account and an email verified by Google. */
export async function claimPendingMembershipAwards(
  userId: number,
  email: string
) {
  const parsed = membershipAwardEmailSchema.safeParse(email);
  if (!parsed.success) return;
  await prisma.$transaction(async (tx) => {
    await lockRecipient(tx, parsed.data);
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email.toLowerCase() !== parsed.data) return;
    await claimAwards(tx, userId, parsed.data);
  });
}

export async function createEmailMembershipAward(
  input: z.infer<typeof emailMembershipAwardSchema>,
  awardedById: number
) {
  const { awardId, email, reason } = emailMembershipAwardSchema.parse(input);
  const dateGiven = new Date(normalizeMembershipDateInput(input.dateGiven));
  // UTC midnight can be the previous day locally. Keep the earned date intact
  // so the server's timezone doesn't move an award into another term.
  const earnedDate = new Date(
    dateGiven.getUTCFullYear(),
    dateGiven.getUTCMonth(),
    dateGiven.getUTCDate()
  );
  const { term, year } = getCurrentSseOperationalTerm(earnedDate);

  return prisma.$transaction(async (tx) => {
    await lockRecipient(tx, email);
    let award = await tx.pendingMembershipAward.findUnique({
      where: { id: awardId },
    });
    if (award) {
      if (
        award.email !== email ||
        award.reason !== reason ||
        award.dateGiven.getTime() !== dateGiven.getTime() ||
        award.awardedById !== awardedById ||
        award.cancelledAt
      ) {
        throw new MembershipAwardError(
          "This award request has already been used. Reopen the form to create another award.",
          409
        );
      }
    } else {
      award = await tx.pendingMembershipAward.create({
        data: {
          id: awardId,
          email,
          reason,
          dateGiven,
          term,
          year,
          awardedById,
        },
      });
    }

    const user = await tx.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (user) await claimAwards(tx, user.id, email);

    const membership = await tx.memberships.findUnique({
      where: { pendingAwardId: awardId },
      select: { id: true, userId: true, reason: true, dateGiven: true },
    });
    return { award, membership };
  });
}

/**
 * Save the award before calling this so an email failure doesn't lose the
 * membership. Delivery can be retried after five minutes.
 */
export async function sendMembershipAwardEmail(
  awardId: string,
  baseUrl: string
) {
  const reserved = await prisma.pendingMembershipAward.updateMany({
    where: {
      id: awardId,
      claimedAt: null,
      cancelledAt: null,
      OR: [
        { emailLastAttemptAt: null },
        { emailLastAttemptAt: { lt: new Date(Date.now() - 5 * 60_000) } },
      ],
    },
    data: { emailStatus: "SENDING", emailLastAttemptAt: new Date() },
  });
  if (!reserved.count) {
    const membership = await prisma.memberships.findUnique({
      where: { pendingAwardId: awardId },
      select: { id: true, userId: true, reason: true, dateGiven: true },
    });
    if (membership) {
      return { membership, message: "Membership already awarded." };
    }
    throw new MembershipAwardError(
      "This award was claimed or cancelled, or an email was attempted in the last five minutes. Refresh the list before retrying.",
      409
    );
  }
  const award = await prisma.pendingMembershipAward.findUniqueOrThrow({
    where: { id: awardId },
  });
  let emailStatus: "SENT" | "FAILED" = "FAILED";
  let message =
    "Award saved, but email is not configured. The membership will still be claimed when they sign in.";
  if (isEmailConfigured()) {
    const claimUrl = `${baseUrl}/memberships/claim?email=${encodeURIComponent(award.email)}`;
    try {
      await sendEmail({
        to: award.email,
        subject: "You earned an SSE membership",
        text: `The SSE has awarded you a membership for ${award.reason} on ${award.dateGiven.toISOString().slice(0, 10)}.\n\nSign in with ${award.email} to claim your pending memberships: ${claimUrl}\n\nYour original earned date will be preserved.`,
        html: `<h1>You earned an SSE membership</h1><p>The SSE has recorded a membership for you.</p><p><a href="${claimUrl}">Sign in to claim your memberships</a></p><p>Use your RIT Google account. Your original earned date will be preserved.</p>`,
      });
      emailStatus = "SENT";
      message = "Award saved and invitation email sent.";
    } catch (error) {
      console.error("Membership award invitation delivery failed", {
        awardId,
        error,
      });
      message =
        "Award saved, but the invitation email could not be sent. You can retry from pending memberships.";
    }
  }
  await prisma.pendingMembershipAward.update({
    where: { id: awardId },
    data: { emailStatus },
  });
  return { emailStatus, message };
}
