import { z } from "zod";

export const UpdateUserSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  linkedIn: z.string().max(500).nullable().optional(),
  gitHub: z.string().max(500).nullable().optional(),
  major: z.string().max(100).nullable().optional(),
  coopSummary: z.string().max(1000).nullable().optional(),
  graduationTerm: z.enum(["SPRING", "SUMMER", "FALL"]).nullable().optional(),
  graduationYear: z.number().int().nullable().optional(),
  image: z.string().max(500).nullable().optional(),
  cleanupImageKeys: z.array(z.string().max(500)).optional(),
});
