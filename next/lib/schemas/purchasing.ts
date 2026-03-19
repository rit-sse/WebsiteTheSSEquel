import { z } from "zod";

export const CreatePurchaseRequestSchema = z.object({
  name: z.string().min(1).max(200),
  committee: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  estimatedCost: z
    .union([z.string().min(1), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => Number.isFinite(val) && val >= 0, {
      message: "estimatedCost must be a non-negative finite number",
    }),
  plannedDate: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "plannedDate must be a valid date string",
    }),
  notifyEmail: z.string().email().max(255),
  eventId: z.string().nullable().optional(),
});
