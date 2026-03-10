import { z } from "zod";

export const CreateGoLinkSchema = z.object({
  golink: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z-]+$/, "must be lowercase letters and hyphens only"),
  url: z.string().min(1).max(500),
  description: z.string().max(500),
  isPinned: z.boolean(),
  isPublic: z.boolean(),
});

export const UpdateGoLinkSchema = z.object({
  id: z.number().int(),
  golink: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z-]+$/, "must be lowercase letters and hyphens only")
    .optional(),
  url: z.string().min(1).max(500).optional(),
  description: z.string().max(500).optional(),
  isPinned: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});
