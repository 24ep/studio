import { z } from 'zod';

import {
  nullableOptionalBooleanFlagSchema,
  nullableOptionalIntegerSchema,
  nullableOptionalNumberSchema,
  nullableOptionalPrimitiveStringSchema,
} from './applicant-v1-schema-coercions';

const contactInfoSchema = z.object({
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
}).strict();

const personalInfoSchema = z.object({
  title_honorific: z.string().optional().nullable(),
  firstname: z.string().optional().nullable(),
  lastname: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  introduction_aboutme: z.string().optional().nullable(),
}).strict();

const jobSuitableEntrySchema = z.object({
  suitable_career: z.string().optional().nullable(),
  suitable_job_level: z.string().optional().nullable(),
  suitable_job_position: z.string().optional().nullable(),
  suitable_salary_bath_month: nullableOptionalPrimitiveStringSchema,
}).strict();

const skillsEntrySchema = z.object({
  segment_skill: z.string().optional().nullable(),
  skill: z.array(z.string()).optional().nullable(),
}).strict();

const applicantInfoObjectSchema = z.object({
    contact_info: contactInfoSchema.optional().nullable(), // allowed to be null/undefined
    personal_info: personalInfoSchema.optional().nullable(), // allowed to be null/undefined
    cv_language: z.string().optional().nullable(),
    skills: z.array(skillsEntrySchema).optional().nullable(),
    job_suitable: z.array(jobSuitableEntrySchema).optional().nullable(),
    // Accept both UUID or name; will be resolved at runtime
    status: z.string().optional().nullable(),
    job_applied: z.unknown().optional().nullable(),
    job_matches: z.array(z.unknown()).optional().nullable(),
    // Email-related fields (optional)
    emailDate: z.string().optional().nullable(),
    emailSubject: z.string().optional().nullable(),
    emailId: z.string().optional().nullable(),
    emailMetadata: z.record(z.unknown()).optional().nullable(),
  }).strict();

type ApplicantInfoObject = z.infer<typeof applicantInfoObjectSchema>;

function toApplicantInfoObject(data: unknown): Partial<ApplicantInfoObject> {
  return data && typeof data === 'object' ? data as Partial<ApplicantInfoObject> : {};
}

export const ApplicantInfoSchema = z.union([
  applicantInfoObjectSchema,
  z.string().transform(() => ({})),
  z.number().transform(() => ({})),
  z.boolean().transform(() => ({})),
]).transform((data) => {
  const applicantInfo = toApplicantInfoObject(data);

  // Ensure all fields are properly typed
  return {
    personal_info: applicantInfo.personal_info || {},
    contact_info: applicantInfo.contact_info || {},
    cv_language: applicantInfo.cv_language || '',
    skills: applicantInfo.skills || [],
    job_suitable: applicantInfo.job_suitable || [],
    status: applicantInfo.status || '',
    job_applied: applicantInfo.job_applied,
    job_matches: applicantInfo.job_matches || [],
    emailDate: applicantInfo.emailDate,
    emailSubject: applicantInfo.emailSubject,
    emailId: applicantInfo.emailId,
    emailMetadata: applicantInfo.emailMetadata,
  };
});

export const structuredEducationSchema = z.object({
  university: z.string().optional().nullable(),
  major: z.string().optional().nullable(),
  startMonth: nullableOptionalIntegerSchema,
  startYear: nullableOptionalIntegerSchema,
  endMonth: nullableOptionalIntegerSchema,
  endYear: nullableOptionalIntegerSchema,
  isCurrent: nullableOptionalBooleanFlagSchema,
  GPA: nullableOptionalNumberSchema,
}).strict();

export const structuredExperienceSchema = z.object({
  company: z.string().optional().nullable(),
  companyReferenceId: z.string().uuid().nullable().optional(),
  position: z.string().optional().nullable(),
  startMonth: nullableOptionalIntegerSchema,
  startYear: nullableOptionalIntegerSchema,
  endMonth: nullableOptionalIntegerSchema,
  endYear: nullableOptionalIntegerSchema,
  isCurrent: nullableOptionalBooleanFlagSchema,
  description: z.string().optional().nullable(),
}).strict(); 
