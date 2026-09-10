import { z } from 'zod';

export const BATCH_SIZE = 50;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const TIMEOUT_MS = 300000;
export const MAX_POSITIONS = 1000;

export const importPositionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  department: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  matchCriteria: z.string().optional().nullable(),
  isOpen: z.boolean().optional(),
  positionLevel: z.string().optional().nullable(),
  custom_attributes: z.unknown().optional().nullable(),
});

export const importPositionsArraySchema = z.array(importPositionSchema);

export type ImportPosition = z.infer<typeof importPositionSchema>;

export interface ImportBatchResults {
  success: number;
  failed: number;
  errors: string[];
}

export interface ImportTotals extends ImportBatchResults {
  processingTime: number;
}
