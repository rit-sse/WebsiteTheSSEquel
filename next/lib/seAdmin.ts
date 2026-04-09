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
