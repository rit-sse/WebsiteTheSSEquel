import { z } from "zod";

export const CreateNavItemSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
  description: z.string().max(500).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  alignment: z.enum(["start", "end"]).optional(),
});

export const UpdateNavItemSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  href: z.string().min(1).max(500).optional(),
  description: z.string().max(500).nullable().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  isVisible: z.boolean().optional(),
  alignment: z.enum(["start", "end"]).nullable().optional(),
});

export const ReorderNavItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        parentId: z.number().int().positive().nullable(),
        sortOrder: z.number().int().min(0).max(10000),
      })
    )
    .max(200),
});
