import type { QueryResultRow } from 'pg';
import { z } from 'zod';

export const companyReferenceInputSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  legalName: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  source: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  appkitAppId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const appKitImportSchema = z.object({
  environment: z.enum(['development', 'production']).default('production'),
});

export type CompanyReferenceInput = z.infer<typeof companyReferenceInputSchema>;
export type AppKitImportInput = z.infer<typeof appKitImportSchema>;

export type CompanyReferenceRow = QueryResultRow & {
  id: string;
  name: string;
  legalName: string | null;
  logo: string | null;
  website: string | null;
  domain: string | null;
  industry: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  metadata: Record<string, unknown> | null;
  source: string | null;
  externalId: string | null;
  appkitAppId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function getCompanyReferencesRouteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
