import { z } from 'zod';

export type ApplicantEvaluationLinkRouteContext = {
  params: Promise<{ id: string }>;
};

export const createEvaluationLinkSchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
  force: z.boolean().optional(),
  requireLogin: z.boolean().optional(),
  interviewDateTime: z.string().optional(),
  interviewLocation: z.string().optional(),
});

export type CreateEvaluationLinkInput = z.infer<typeof createEvaluationLinkSchema>;

export type UpdateEvaluationLinkInput = {
  days?: number;
  requireLogin?: boolean;
};
