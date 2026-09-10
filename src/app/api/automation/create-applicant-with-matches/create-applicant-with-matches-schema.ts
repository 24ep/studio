import { z } from 'zod';

export const jobMatchSchema = z.object({
  jobId: z.string().optional(),
  jobTitle: z.string().optional(),
  fitScore: z.number().min(0).max(1).optional(),
  matchReasons: z.array(z.string()).optional(),
  job_description_summary: z.string().optional(),
});

export const applicantDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  status: z.string().uuid().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  recruiterId: z.string().uuid().optional().nullable(),
  parsedData: z.record(z.string(), z.unknown()).optional(),
  fitScore: z.number().optional().default(0),
  dataAiHint: z.string().optional().nullable(),
  applicationDate: z.string().optional(),
  uploadDate: z.string().optional(),
  emailDate: z.string().optional().nullable(),
  emailSubject: z.string().optional().nullable(),
  emailId: z.string().optional().nullable(),
  emailMetadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const requestSchema = z.object({
  applicant: applicantDataSchema,
  job_matches: z.array(jobMatchSchema).optional(),
});

export type AutomationApplicantInput = z.infer<typeof applicantDataSchema>;
export type AutomationJobMatchInput = z.infer<typeof jobMatchSchema>;
export type AutomationJobMatchWithJobId = AutomationJobMatchInput & { jobId: string };
