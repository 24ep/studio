import * as z from 'zod';

import type { RecruitmentStage } from '@/lib/types';

export const PLACEHOLDER_VALUE_NONE = "___NOT_SPECIFIED___";

const personalInfoFormSchema = z.object({
  title_honorific: z.string().optional(),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  nickname: z.string().optional(),
  location: z.string().optional(),
  introduction_aboutme: z.string().optional(),
  avatar_url: z.union([z.string().url("Enter a valid avatar URL"), z.literal("")]).optional(),
});

const contactInfoFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const educationEntryFormSchema = z.object({
  university: z.string().min(1, "University is required"),
  major: z.string().optional().nullable(),
  field: z.string().optional().nullable(),
  campus: z.string().optional().nullable(),
  startMonth: z.number().min(1).max(12, "Start month must be 1-12"),
  startYear: z.number().min(1900).max(2100, "Start year must be between 1900-2100"),
  endMonth: z.number().min(1).max(12).optional().nullable(),
  endYear: z.number().min(1900).max(2100).optional().nullable(),
  isCurrent: z.boolean().default(false),
  GPA: z.string().optional().nullable(),
});

const experienceEntryFormSchema = z.object({
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  description: z.string().optional().nullable(),
  startMonth: z.number().min(1).max(12, "Start month must be 1-12"),
  startYear: z.number().min(1900).max(2100, "Start year must be between 1900-2100"),
  endMonth: z.number().min(1).max(12).optional().nullable(),
  endYear: z.number().min(1900).max(2100).optional().nullable(),
  isCurrent: z.boolean().default(false),
  positionLevel: z.string().optional().nullable(),
});

const skillEntryFormSchema = z.object({
  segment_skill: z.string().optional(),
  skill_string: z.string().optional(),
});

export const addApplicantFormSchema = z.object({
  cv_language: z.string().optional(),
  personal_info: personalInfoFormSchema,
  contact_info: contactInfoFormSchema,
  education: z.array(educationEntryFormSchema).optional(),
  experience: z.array(experienceEntryFormSchema).optional(),
  skills: z.array(skillEntryFormSchema).optional(),
  job_suitable: z.unknown().optional(),
  positionId: z.string().uuid("Position is required"),
  status: z.string().uuid("Status must be a valid UUID").min(1, "Status is required"),
  fitScore: z.number().min(0).max(100).optional().default(0),
  job_matches: z.unknown().optional(),
  job_applied: z.unknown().optional(),
  applicationDate: z.string().min(1, "Application date is required"),
  sourceId: z.union([z.string().uuid(), z.literal("")]).optional(),
  subSource: z.string().optional(),
  assignmentJustification: z.string().optional(),
  customAttributes: z.string().optional().superRefine((value, context) => {
    if (!value?.trim()) return;
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Custom attributes must be a JSON object" });
      }
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Enter valid JSON" });
    }
  }),
});

export type AddApplicantFormValues = z.infer<typeof addApplicantFormSchema>;

export function getDefaultApplicantStatusId(stages: RecruitmentStage[]) {
  return stages.find(stage => stage.name.toLowerCase() === 'applied')?.id || stages[0]?.id || '';
}

export function createEducationDefaults(date = new Date()) {
  return {
    university: '',
    major: '',
    field: '',
    campus: '',
    startMonth: date.getMonth() + 1,
    startYear: date.getFullYear(),
    endMonth: null,
    endYear: null,
    isCurrent: false,
    GPA: '',
  };
}

export function createExperienceDefaults(date = new Date(), isCurrent = false) {
  return {
    company: '',
    position: '',
    startMonth: date.getMonth() + 1,
    startYear: date.getFullYear(),
    endMonth: null,
    endYear: null,
    isCurrent,
    description: '',
    positionLevel: null,
  };
}

export function createSkillDefaults() {
  return { segment_skill: '', skill_string: '' };
}

export function createAddApplicantDefaultValues(stages: RecruitmentStage[], date = new Date()): AddApplicantFormValues {
  return {
    cv_language: '',
    personal_info: { firstname: '', lastname: '', avatar_url: '' },
    contact_info: { email: '', phone: '' },
    education: [],
    experience: [],
    skills: [createSkillDefaults()],
    job_suitable: [],
    positionId: '',
    status: getDefaultApplicantStatusId(stages),
    fitScore: 0,
    applicationDate: date.toISOString().slice(0, 10),
    sourceId: '',
    subSource: '',
    assignmentJustification: '',
    customAttributes: '',
  };
}

export function createOpenAddApplicantDefaultValues(stages: RecruitmentStage[], date = new Date()): AddApplicantFormValues {
  return {
    ...createAddApplicantDefaultValues(stages, date),
    experience: [createExperienceDefaults(date, true)],
  };
}

export function prepareAddApplicantSubmission(data: AddApplicantFormValues): AddApplicantFormValues {
  return {
    ...data,
    fitScore: data.fitScore ? data.fitScore / 100 : 0,
    experience: data.experience?.map(exp => ({
      ...exp,
      positionLevel: exp.positionLevel === PLACEHOLDER_VALUE_NONE ? null : exp.positionLevel,
    })),
  };
}

export function buildCreateApplicantRequest(data: AddApplicantFormValues) {
  const normalized = prepareAddApplicantSubmission(data);
  const jobApplied = normalized.positionId
    ? {
      jobId: normalized.positionId,
      fitScore: normalized.fitScore || 0,
      ...(normalized.assignmentJustification?.trim()
        ? {
          justification: normalized.assignmentJustification
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean),
        }
        : {}),
    }
    : undefined;

  return {
    applicant_info: {
      cv_language: normalized.cv_language,
      personal_info: normalized.personal_info,
      contact_info: normalized.contact_info,
      education: normalized.education,
      experience: normalized.experience,
      skills: normalized.skills,
      job_suitable: Array.isArray(normalized.job_suitable) ? normalized.job_suitable : [],
      status: normalized.status,
    },
    job_matches: Array.isArray(normalized.job_matches) ? normalized.job_matches : [],
    job_applied: normalized.job_applied ?? jobApplied,
    applicationDate: normalized.applicationDate,
    sourceId: normalized.sourceId || null,
    subSource: normalized.subSource?.trim() || null,
    customAttributes: normalized.customAttributes?.trim()
      ? JSON.parse(normalized.customAttributes)
      : {},
    assignmentJustification: normalized.assignmentJustification?.trim() || null,
  };
}
