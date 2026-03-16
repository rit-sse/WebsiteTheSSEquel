import { z } from "zod";

const GoLinkUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .url("must be a valid absolute URL")
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must use http:// or https://");

export const CreateGoLinkSchema = z.object({
  golink: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z-]+$/, "must be lowercase letters and hyphens only"),
  url: GoLinkUrlSchema,
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
  url: GoLinkUrlSchema.optional(),
  description: z.string().max(500).optional(),
  isPinned: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});
