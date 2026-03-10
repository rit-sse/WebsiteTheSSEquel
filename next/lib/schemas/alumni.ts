import { z } from "zod";

export const CreateAlumniSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  linkedIn: z.string().max(500).optional(),
  gitHub: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  image: z.string().max(500).optional(),
  quote: z.string().max(2000).optional(),
  previous_roles: z.string().max(1000).optional(),
  showEmail: z.boolean().optional(),
  receiveEmails: z.boolean().optional(),
});

export const UpdateAlumniSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  start_date: z.string().min(1).optional(),
  end_date: z.string().min(1).optional(),
  linkedIn: z.string().max(500).optional(),
  gitHub: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  image: z.string().max(500).optional(),
  quote: z.string().max(2000).optional(),
  previous_roles: z.string().max(1000).optional(),
});
