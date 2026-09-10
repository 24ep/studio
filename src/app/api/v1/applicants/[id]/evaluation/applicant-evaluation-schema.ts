import { z } from 'zod';

export type ApplicantEvaluationRouteContext = {
  params: Promise<{ id: string }>;
};

export const createEvaluationSchema = z.object({
  positionId: z.string().uuid().optional(),
  evaluatorId: z.string().uuid().optional(),
  personalityScores: z.array(z.object({
    traitId: z.string().uuid(),
    score: z.number().min(1).max(5),
    notes: z.string().optional(),
  })),
  expertiseScores: z.array(z.object({
    skillId: z.string().uuid(),
    score: z.number().min(0),
    notes: z.string().optional(),
  })).optional(),
  overallScore: z.number().min(0).max(5),
  comments: z.string().optional(),
  status: z.enum(['in_progress', 'completed', 'draft']).default('in_progress'),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type PersonalityScoreInput = CreateEvaluationInput['personalityScores'][number];
export type ExpertiseScoreInput = NonNullable<CreateEvaluationInput['expertiseScores']>[number];
