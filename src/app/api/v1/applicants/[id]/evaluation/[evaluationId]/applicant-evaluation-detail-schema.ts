import { z } from 'zod';

export type ApplicantEvaluationDetailRouteContext = {
  params: Promise<{ id: string; evaluationId: string }>;
};

export const updateEvaluationSchema = z.object({
  personalityScores: z.array(z.object({
    traitId: z.string().uuid(),
    score: z.number().min(1).max(5),
    notes: z.string().optional(),
  })).optional(),
  expertiseScores: z.array(z.object({
    skillId: z.string().uuid(),
    score: z.number().min(0),
    notes: z.string().optional(),
  })).optional(),
  overallScore: z.number().min(0).max(5).optional(),
  comments: z.string().optional(),
  status: z.enum(['in_progress', 'completed', 'draft']).optional(),
});

export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;
export type UpdatePersonalityScoreInput = NonNullable<UpdateEvaluationInput['personalityScores']>[number];
export type UpdateExpertiseScoreInput = NonNullable<UpdateEvaluationInput['expertiseScores']>[number];
