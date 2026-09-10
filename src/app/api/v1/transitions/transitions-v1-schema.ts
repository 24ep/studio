import { z } from 'zod';

export const createTransitionSchema = z.object({
  applicantId: z.string().uuid('Invalid Applicant ID'),
  fromStageId: z.string().uuid('Invalid from stage ID'),
  toStageId: z.string().uuid('Invalid to stage ID'),
  notes: z.string().optional(),
  transitionDate: z.string().datetime().optional(),
});

export type CreateTransitionInput = z.infer<typeof createTransitionSchema>;

export interface TransitionListOptions {
  applicantId: string | null;
  limit: number;
  offset: number;
}
