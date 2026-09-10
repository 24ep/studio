import { z } from 'zod';

const applicantInfoSchema = z.object({
  personal_info: z.object({
    title_honorific: z.string().optional().nullable(),
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    nickname: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    introduction_aboutme: z.string().optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
  }),
  contact_info: z.object({
    email: z.string().email(),
    phone: z.string().optional().nullable(),
  }),
  education: z.array(z.unknown()).optional(),
  experience: z.array(z.unknown()).optional(),
  skills: z.array(z.unknown()).optional(),
  job_suitable: z.array(z.unknown()).optional(),
  cv_language: z.string().optional().nullable(),
  status: z.string().optional(),
});

export const createApplicantSchema = z.object({
  applicant_info: applicantInfoSchema,
  job_matches: z.array(z.unknown()).optional(),
  job_applied: z.unknown().optional(),
  applicationDate: z.string().optional(),
  sourceId: z.string().uuid().optional().nullable(),
  subSource: z.string().optional().nullable(),
  customAttributes: z.record(z.string(), z.unknown()).optional(),
  assignmentJustification: z.string().optional().nullable(),
});

export type CreateApplicantInput = z.infer<typeof createApplicantSchema>;
