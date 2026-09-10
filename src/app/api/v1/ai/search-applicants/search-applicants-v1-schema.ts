import { z } from 'zod';

export const searchApplicantsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  positionId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type SearchApplicantsInput = z.infer<typeof searchApplicantsSchema>;
