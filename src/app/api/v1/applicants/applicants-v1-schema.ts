import { z } from 'zod';
import { ApplicantInfoSchema, structuredEducationSchema, structuredExperienceSchema } from './schemas';

export const createApplicantSchema = z.object({
  applicant_info: ApplicantInfoSchema.optional().nullable(),
  educationData: z.array(structuredEducationSchema).optional().nullable(),
  experienceData: z.array(structuredExperienceSchema).optional().nullable(),
  job_applied: z.unknown().optional().nullable(),
  job_matches: z.array(z.unknown()).optional().nullable(),
  sourceId: z.string().uuid().nullable().optional(),
  subSource: z.string().optional().nullable(),
  expectedSalary: z.number().optional().nullable(),
}).strict().transform((data) => ({
  applicant_info: data.applicant_info || {},
  educationData: data.educationData || [],
  experienceData: data.experienceData || [],
  job_applied: data.job_applied,
  job_matches: data.job_matches || [],
  sourceId: data.sourceId || null,
  subSource: data.subSource || null,
  expectedSalary: data.expectedSalary || null,
}));

export type CreateApplicantInput = z.infer<typeof createApplicantSchema>;
