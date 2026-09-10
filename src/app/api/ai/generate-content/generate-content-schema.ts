import { z } from 'zod';

export const generateContentSchema = z.object({
  applicantId: z.string().min(1, 'Applicant ID is required'),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  promptName: z.string().optional(),
  promptCategory: z.string().optional(),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;
