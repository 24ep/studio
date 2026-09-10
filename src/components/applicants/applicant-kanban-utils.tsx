import type { Applicant } from '@/lib/types';
import {
  getApplicantParsedArrayValue,
  getApplicantParsedValue,
  isApplicantParsedRecord,
  type ApplicantParsedRecord,
} from './applicant-parsed-data-utils';
export { StatusBadge } from './applicant-status-badge';

export type ApplicantEducationSummary = ApplicantParsedRecord & {
  major?: string;
  field?: string;
  university?: string;
};

export type ApplicantExperienceSummary = ApplicantParsedRecord & {
  position?: string;
  company?: string;
};

export type ApplicantSkillSummary = ApplicantParsedRecord & {
  skill_string?: string;
  segment_skill?: string;
};

function filterParsedRecords<T extends ApplicantParsedRecord>(items: unknown[]): T[] {
  return items.filter(isApplicantParsedRecord) as T[];
}

export function getParsedDataProperty(applicant: Applicant, propertyName: string) {
  return getApplicantParsedValue(applicant.parsedData, propertyName);
}

export function getEducation(applicant: Applicant): ApplicantEducationSummary[] {
  if (!applicant) return [];

  if (Array.isArray(applicant.educationData) && applicant.educationData.length > 0) {
    return filterParsedRecords<ApplicantEducationSummary>(applicant.educationData);
  }

  return filterParsedRecords<ApplicantEducationSummary>(getApplicantParsedArrayValue(applicant.parsedData, 'education'));
}

export function getExperience(applicant: Applicant): ApplicantExperienceSummary[] {
  if (!applicant) return [];

  if (Array.isArray(applicant.experienceData) && applicant.experienceData.length > 0) {
    return filterParsedRecords<ApplicantExperienceSummary>(applicant.experienceData);
  }

  return filterParsedRecords<ApplicantExperienceSummary>(getApplicantParsedArrayValue(applicant.parsedData, 'experience'));
}

export function getSkills(applicant: Applicant): ApplicantSkillSummary[] {
  return filterParsedRecords<ApplicantSkillSummary>(getApplicantParsedArrayValue(applicant.parsedData, 'skills'));
}

const fieldLabelMap: Record<string, string> = {
  status: 'Status',
  recruiterId: 'Recruiter',
  positionId: 'Position',
  fitScore: 'Fit Score',
  applicationDate: 'Application Date',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
};

export function getFieldLabel(key: string) {
  return fieldLabelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
}
