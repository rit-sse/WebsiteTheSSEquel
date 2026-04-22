import prisma from "@/lib/prisma";
import type { AuthLevel } from "@/lib/authLevel";

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

export async function isUserSeAdmin(userId: number | null) {
  if (!userId) return false;
  const officer = await prisma.officer.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      position: { title: SE_ADMIN_POSITION_TITLE },
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
