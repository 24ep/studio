import { z } from 'zod';

export const recruitmentStageSchema = z.object({
  name: z.string().min(1, 'Stage name cannot be empty.'),
  description: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
  color_complete: z.string().optional().nullable(),
  color_badge: z.string().optional().nullable(),
});

export type RecruitmentStageInput = z.infer<typeof recruitmentStageSchema>;

export function getRecruitmentStageRouteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
