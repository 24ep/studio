import { safeJsonParse } from '@/lib/utils';
import { z } from 'zod';

export const applicantImportSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  positionName: z.string().optional(),
  recruiterId: z.string().uuid().optional().nullable(),
  recruiterName: z.string().optional(),
  fitScore: z.string().optional(),
  status: z.string().optional().default('Applied'),
  statusId: z.string().uuid().optional().nullable(),
  applicationDate: z.string().optional(),
  appliedJob: z.string().optional(),
  appliedJobJustification: z.string().optional(),
  jobMatches: z.string().optional(),
  location: z.string().optional(),
  introductionAboutMe: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  skills: z.string().optional(),
  jobSuitable: z.string().optional(),
  customAttributes: z.string().optional(),
});

export type ApplicantImportInput = z.infer<typeof applicantImportSchema>;

export interface ApplicantImportResults {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function parseFitScore(fitScoreStr: string | undefined): number | null {
  if (!fitScoreStr) return null;
  const parsed = parseFloat(fitScoreStr);
  return Number.isNaN(parsed) ? null : Math.max(0, Math.min(1, parsed / 100));
}

export function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseJsonField(jsonStr: string | undefined): unknown {
  if (!jsonStr) return null;
  try {
    return safeJsonParse(jsonStr, null);
  } catch {
    return null;
  }
}
