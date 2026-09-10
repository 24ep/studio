import { z } from 'zod';

export const bulkPositionActionSchema = z.object({
  action: z.enum(['delete', 'change_status', 'update_match_criteria']),
  positionIds: z.array(z.string().uuid()).min(1, 'At least one position ID is required.'),
  newIsOpenStatus: z.boolean().optional(),
  matchCriteria: z.string().optional(),
});

export const positionIdsSchema = z.string().uuid().array();

export type BulkPositionActionInput = z.infer<typeof bulkPositionActionSchema>;

export type PositionBulkActionResult = {
  successCount: number;
  failCount: number;
  failedDetails: { positionId: string; reason: string }[];
  cacheInvalidated: boolean;
};
