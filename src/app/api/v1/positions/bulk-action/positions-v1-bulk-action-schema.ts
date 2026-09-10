import { z } from 'zod';

export const v1PositionBulkActionSchema = z.object({
  action: z.enum(['delete', 'update_status', 'update_department', 'update_match_criteria']),
  positionIds: z.array(z.string().uuid()),
  data: z.object({
    isOpen: z.boolean().optional(),
    department: z.string().min(1).optional(),
    matchCriteria: z.string().optional(),
  }).optional(),
});

export type V1PositionBulkActionInput = z.infer<typeof v1PositionBulkActionSchema>;
export type V1PositionBulkAction = V1PositionBulkActionInput['action'];
