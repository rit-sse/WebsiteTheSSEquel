import { z } from "zod";

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  leadid: z.number().int(),
  completed: z.boolean(),
  repoLink: z.string().max(500).optional(),
  contentURL: z.string().max(500).optional(),
  progress: z.string().max(1000).optional(),
  projectImage: z.string().max(500).optional(),
});

export const UpdateProjectSchema = z.object({
  id: z.number().int(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  leadid: z.number().int().optional(),
  completed: z.boolean().optional(),
  repoLink: z.string().max(500).optional(),
  contentURL: z.string().max(500).optional(),
  progress: z.string().max(1000).optional(),
  projectImage: z.string().max(500).optional(),
});
