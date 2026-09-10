import type { LogLevel } from '@/lib/types';
import { z } from 'zod';

export const logLevelValues: [LogLevel, ...LogLevel[]] = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT'];

export const createLogEntrySchema = z.object({
  level: z.enum(logLevelValues),
  message: z.string().min(1, { message: 'Log message cannot be empty' }),
  source: z.string().optional(),
  timestamp: z.string().datetime({ message: 'Invalid datetime string. Must be UTC ISO8601' }).optional(),
  actingUserId: z.string().uuid().nullable().optional(),
  details: z.record(z.unknown()).nullable().optional(),
});

export type CreateLogEntryInput = z.infer<typeof createLogEntrySchema>;
