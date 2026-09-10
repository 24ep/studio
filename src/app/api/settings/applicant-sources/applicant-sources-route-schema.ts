import type { QueryResultRow } from 'pg';
import { z } from 'zod';

export const createApplicantSourceSchema = z.object({
  name: z.string().min(1, "Source name is required"),
  description: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  allowSubSource: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const appKitApplicantSourcesImportSchema = z.object({
  environment: z.enum(['development', 'production']).default('production'),
});

export type CreateApplicantSourceInput = z.infer<typeof createApplicantSourceSchema>;
export type AppKitApplicantSourcesImportInput = z.infer<typeof appKitApplicantSourcesImportSchema>;

export type ApplicantSourceRow = QueryResultRow & {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  logo: string | null;
  allowSubSource: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicantSourceIdRow = QueryResultRow & {
  id: string;
};

export function getApplicantSourcesRouteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
