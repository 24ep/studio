import { z } from 'zod';
import { ApplicantInfoSchema, structuredEducationSchema, structuredExperienceSchema } from '../schemas';

export const v1ApplicantImportSchema = z.object({
  applicants: z.array(
    z.union([
      z.object({
        applicant_info: ApplicantInfoSchema,
        educationData: z.array(structuredEducationSchema).optional(),
        experienceData: z.array(structuredExperienceSchema).optional(),
      }),
      z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional().nullable(),
        status: z.string().optional(),
        positionId: z.string().uuid().optional().nullable(),
        recruiterId: z.string().uuid().optional().nullable(),
        fitScore: z.number().min(0).max(100).optional(),
        custom_attributes: z.record(z.unknown()).optional().nullable(),
        parsedData: z.unknown().optional().nullable(),
        resumePath: z.string().optional().nullable(),
      }),
    ])
  ),
});

export type V1ApplicantImportApplicant = z.infer<typeof v1ApplicantImportSchema>['applicants'][number];
