/**
 * Zod schemas for Page CRUD endpoints.
 *
 * Slug rules + reserved-prefix rejection live in `lib/pageBuilder/blocks.ts`
 * (validateSlug). Block content shape lives there too (PageContentSchema).
 */
import { z } from "zod";
import { PageContentSchema } from "@/lib/pageBuilder/blocks";

/** All NavSection enum values, kept in sync with prisma/schema.prisma */
export const NavSectionEnum = z.enum([
  "TOP_LEVEL",
  "STUDENTS",
  "ALUMNI",
  "COMPANIES",
  "SE_OFFICE",
  "HIDDEN",
]);
export type NavSectionValue = z.infer<typeof NavSectionEnum>;

export const CreatePageSchema = z.object({
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  navSection: NavSectionEnum.optional(),
  showInNav: z.boolean().optional(),
  navLabel: z.string().min(1).max(80).optional(),
  navOrder: z.number().int().min(0).max(10000).optional(),
});
export type CreatePageInput = z.infer<typeof CreatePageSchema>;

export const UpdatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  // Slug change is allowed but gated to primary officers in the route handler.
  slug: z.string().min(1).max(200).optional(),
  // Toggling the system lock is gated to primary officers in the route handler.
  systemLocked: z.boolean().optional(),
  draftContent: PageContentSchema.optional(),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(500).nullable().optional(),
  showInNav: z.boolean().optional(),
  navSection: NavSectionEnum.optional(),
  navLabel: z.string().max(80).nullable().optional(),
  navOrder: z.number().int().min(0).max(10000).optional(),
  /**
   * Optimistic concurrency. The editor sends the `updatedAt` value it
   * loaded with; the server 409s if it doesn't match the row's current
   * value to prevent two concurrent editors from clobbering each other.
   */
  expectedUpdatedAt: z.string().datetime().optional(),
});
export type UpdatePageInput = z.infer<typeof UpdatePageSchema>;

export const RollbackPageSchema = z.object({
  versionId: z.number().int().positive(),
});
