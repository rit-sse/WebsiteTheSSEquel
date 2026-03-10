import { z } from "zod";

export const CreateMentorSchema = z.object({
  expirationDate: z.string().min(1),
  isActive: z.boolean(),
  userId: z.number().int(),
});

export const UpdateMentorSchema = z.object({
  id: z.number().int(),
  expirationDate: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  userId: z.number().int().optional(),
});
