import type { EducationEntry, ExperienceEntry } from '@/lib/types';

export interface EmployeeRecruitmentAttachment {
  id?: string;
  url?: string;
  label?: string;
  filename?: string;
  fileName?: string;
  name?: string;
  originalName?: string;
  uploadedAt?: string | Date;
}

export interface EmployeeRecruitmentTransition {
  id?: string;
  date?: string | Date;
  stage?: string;
  stageName?: string | null;
  stageColor?: string | null;
  notes?: string;
  actingUser?: {
    name?: string | null;
  } | null;
  position?: {
    id?: string;
    title?: string | null;
  } | null;
}

export interface EmployeeRecruitmentData {
  applicant: Record<string, unknown> | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  attachments: EmployeeRecruitmentAttachment[];
  transitionHistory: EmployeeRecruitmentTransition[];
}

export function isRecruitmentRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function recordArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecruitmentRecord) as T[];
}

export function getEmployeeRecruitmentData(value: unknown): EmployeeRecruitmentData {
  if (!isRecruitmentRecord(value)) {
    return {
      applicant: null,
      education: [],
      experience: [],
      attachments: [],
      transitionHistory: [],
    };
  }

  const parsedData = isRecruitmentRecord(value.parsedData) ? value.parsedData : null;
  const directEducation = recordArray<EducationEntry>(value.educationData);
  const directExperience = recordArray<ExperienceEntry>(value.experienceData);

  return {
    applicant: value,
    education: directEducation.length > 0
      ? directEducation
      : recordArray<EducationEntry>(parsedData?.education),
    experience: directExperience.length > 0
      ? directExperience
      : recordArray<ExperienceEntry>(parsedData?.experience),
    attachments: recordArray<EmployeeRecruitmentAttachment>(value.attachments),
    transitionHistory: recordArray<EmployeeRecruitmentTransition>(value.transitionHistory),
  };
}

export function getRecruitmentRecord(value: unknown): Record<string, unknown> | null {
  return isRecruitmentRecord(value) ? value : null;
}

export function getRecruitmentText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}
