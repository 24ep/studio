import { z } from 'zod';

export const updateApplicantSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  recruiterId: z.string().uuid().nullable().optional(),
  fitScore: z.number().min(0).max(1).optional(),
  status: z.string().uuid('Invalid status: must be a stage UUID').optional(),
  parsedData: z.record(z.unknown()).optional().nullable(),
  custom_attributes: z.record(z.unknown()).optional().nullable(),
  resumePath: z.string().optional().nullable(),
  transitionNotes: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  sourceId: z.string().uuid().nullable().optional(),
  subSource: z.string().optional().nullable(),
  applicant_info: z.object({
    personal_info: z.object({
      title_honorific: z.string().optional().nullable(),
      firstname: z.string().min(1).optional(),
      lastname: z.string().min(1).optional(),
      nickname: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      introduction_aboutme: z.string().optional().nullable(),
    }).optional(),
    contact_info: z.object({
      email: z.string().email().optional(),
      phone: z.string().optional().nullable(),
    }).optional(),
    education: z.array(z.unknown()).optional(),
    experience: z.array(z.unknown()).optional(),
    skills: z.array(z.unknown()).optional(),
    job_suitable: z.array(z.unknown()).optional(),
    cv_language: z.string().optional().nullable(),
    status: z.string().uuid('Invalid status: must be a stage UUID').optional(),
    fitScore: z.number().min(0).max(1).optional(),
  }).optional(),
  job_matches: z.array(z.object({
    fitScore: z.number().min(0).max(1),
    jobId: z.string().uuid(),
    matchReasons: z.array(z.string()).optional().default([]),
  })).optional(),
  job_applied: z.object({
    fitScore: z.number().min(0).max(1),
    jobId: z.string().uuid(),
    justification: z.array(z.string()).optional().default([]),
  }).optional(),
});

export type UpdateApplicantInput = z.infer<typeof updateApplicantSchema>;

export type V1ApplicantDetailContext = {
  params: Promise<{ id: string }>;
};
