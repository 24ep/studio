import { z } from 'zod';

export const updatePositionSchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  matchCriteria: z.string().optional().nullable(),
  isOpen: z.boolean().optional(),
  positionLevel: z.string().optional().nullable(),
  positionAttribute: z.string().optional().nullable(),
  probationPeriodDays: z.coerce.number().int().min(1).max(730).optional(),
  probationEvaluationFrequencyDays: z.coerce.number().int().min(1).max(365).optional(),
  gradeId: z.union([
    z.string().uuid(),
    z.null(),
  ]).optional(),
  recruiterId: z.union([
    z.string().uuid(),
    z.null(),
  ]).optional(),
  organizationUnitId: z.string().uuid().optional(),
  custom_attributes: z.record(z.unknown()).optional().nullable(),
});

export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

export type PositionRouteContext = {
  params: Promise<{ id: string }>;
};
