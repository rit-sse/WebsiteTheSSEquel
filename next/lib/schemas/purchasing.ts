import { z } from "zod";

export const CreatePurchaseRequestSchema = z.object({
  name: z.string().min(1).max(200),
  committee: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  estimatedCost: z.union([z.string().min(1), z.number()]).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ),
  plannedDate: z.string().min(1),
  notifyEmail: z.string().email().max(255),
  eventId: z.string().nullable().optional(),
});
