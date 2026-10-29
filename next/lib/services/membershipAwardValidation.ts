import { z } from "zod";
import { MANUAL_MEMBERSHIP_REASONS } from "@/lib/membershipUtils";

export const membershipAwardEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(255)
  .endsWith("@g.rit.edu");

export const emailMembershipAwardSchema = z.object({
  awardId: z.string().uuid(),
  email: membershipAwardEmailSchema,
  reason: z.enum(MANUAL_MEMBERSHIP_REASONS),
  dateGiven: z.string().min(1),
});
