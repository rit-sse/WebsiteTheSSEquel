import { z } from "zod";

export const CreateQuoteSchema = z.object({
  dateAdded: z.string().min(1),
  quote: z.string().min(1).max(2000),
  userId: z.number().int(),
  author: z.string().max(100).optional(),
});

export const UpdateQuoteSchema = z.object({
  id: z.number().int(),
  userId: z.number().int().optional(),
  quote: z.string().min(1).max(2000).optional(),
  author: z.string().max(100).optional(),
});
