import prisma from "@/lib/prisma";
import type { AuthLevel } from "@/lib/authLevel";

/**
 * Legacy constant — the original "SE Admin" position title. Kept around
 * because amendmentService still references it for backwards-compat in
 * old data. New code should use the `SE_OFFICE` category check instead
 * (any active officer whose position has `category = SE_OFFICE` counts
 * as an "SE Admin" for permission purposes — Administrative Assistant,
 * Dean, SE Office Head, Undergraduate Dean).
 */
export const SE_ADMIN_POSITION_TITLE = "SE Admin";

/**
 * Whether the user can manage amendments (change status, approve, reject, merge).
 * SE Admin and primary officers both have this power.
 */
export function canManageAmendments(
  authLevel: Pick<AuthLevel, "isPrimary" | "isSeAdmin">
): boolean {
  return authLevel.isPrimary || authLevel.isSeAdmin;
}

/* ─── Election management helpers ─── */

export async function isUserCurrentPresident(userId: number | null) {
  if (!userId) return false;
  const officer = await prisma.officer.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      position: { title: "President" },
    },
    select: { id: true },
  });
  return !!officer;
}

/**
 * Anyone holding ANY active SE Office position counts as an "SE Admin"
 * for permission purposes. Per the SE Office: Administrative Assistant,
 * Dean, SE Office Head, and Undergraduate Dean all have the same
 * elevated access — including the ability to certify election results.
 */
export async function isUserSeAdmin(userId: number | null) {
  if (!userId) return false;
  const officer = await prisma.officer.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      position: { category: "SE_OFFICE" },
    },
    select: { id: true },
  });
  return !!officer;
}

export async function canManageElections(authLevel: Pick<AuthLevel, "userId" | "isSeAdmin">) {
  if (!authLevel.userId) return false;
  if (authLevel.isSeAdmin) return true;
  return isUserCurrentPresident(authLevel.userId);
}

export async function getElectionApprovalRole(
  authLevel: Pick<AuthLevel, "userId" | "isSeAdmin">
): Promise<"PRESIDENT" | "SE_ADMIN" | null> {
  if (!authLevel.userId) return null;
  if (await isUserCurrentPresident(authLevel.userId)) return "PRESIDENT";
  if (authLevel.isSeAdmin) return "SE_ADMIN";
  return null;
}
