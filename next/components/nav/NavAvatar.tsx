"use client";

/**
 * Thin re-export kept for backwards compatibility. The canonical
 * primitive now lives at `components/ui/user-avatar.tsx` and owns the
 * shared initials + image-fallback logic used across the app (navbar,
 * profile settings, image upload, etc.).
 *
 * New consumers should import `UserAvatar` directly from
 * `@/components/ui/user-avatar`. This file can be removed once all
 * call sites have migrated.
 */
export { default } from "@/components/ui/user-avatar";
