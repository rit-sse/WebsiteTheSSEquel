import { z } from "zod";

export const CreateSponsorSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  logoUrl: z.string().min(1).max(500),
  websiteUrl: z.string().min(1).max(500),
  isActive: z.boolean().optional(),
});

export const UpdateSponsorSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  logoUrl: z.string().min(1).max(500).optional(),
  websiteUrl: z.string().min(1).max(500).optional(),
  isActive: z.boolean().optional(),
});
