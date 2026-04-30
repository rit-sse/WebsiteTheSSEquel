import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export const CreatePhotoCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .refine((s) => SLUG_REGEX.test(s), {
      message: "Slug must be lowercase letters, digits, hyphens, and underscores.",
    }),
  label: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
});
export type CreatePhotoCategoryInput = z.infer<typeof CreatePhotoCategorySchema>;

export const UpdatePhotoCategorySchema = z.object({
  label: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  /**
   * Renaming a category's slug propagates via Photo.category's
   * ON UPDATE CASCADE FK — single SQL statement, no app-level backfill.
   */
  slug: z
    .string()
    .min(1)
    .max(80)
    .refine((s) => SLUG_REGEX.test(s), {
      message: "Slug must be lowercase letters, digits, hyphens, and underscores.",
    })
    .optional(),
});
export type UpdatePhotoCategoryInput = z.infer<typeof UpdatePhotoCategorySchema>;

export const MergePhotoCategoriesSchema = z.object({
  fromSlug: z.string().min(1).max(80),
  intoSlug: z.string().min(1).max(80),
});
