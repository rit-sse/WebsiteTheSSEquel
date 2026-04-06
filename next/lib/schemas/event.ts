import { z } from "zod";

export const CreateEventSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  date: z.string().min(1),
  location: z.string().max(200).optional(),
  image: z.string().max(500).optional(),
  attendanceEnabled: z.boolean().optional(),
  grantsMembership: z.boolean().optional(),
});

export const UpdateEventSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  date: z.string().min(1).optional(),
  location: z.string().max(200).optional(),
  image: z.string().max(500).optional(),
  attendanceEnabled: z.boolean().optional(),
  grantsMembership: z.boolean().optional(),
});
