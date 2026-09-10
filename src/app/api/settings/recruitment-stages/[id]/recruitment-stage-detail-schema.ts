import { z } from 'zod';

export type RecruitmentStageDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export const updateRecruitmentStageSchema = z.object({
  name: z.string().min(1, 'Stage name cannot be empty.').optional(),
  description: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
  color_complete: z.string().optional().nullable(),
  color_badge: z.string().optional().nullable(),
});

export type UpdateRecruitmentStageInput = z.infer<typeof updateRecruitmentStageSchema>;
