import type { Applicant } from '../../lib/types';
import { getScoreGradeInfo } from '../../lib/scoreUtils';
import { parseApplicantParsedDataRecord } from './applicant-parsed-data-utils';

export function getApplicantRecruiterLabel(applicant: Applicant) {
  return applicant.recruiter?.name || 'Unassigned';
}

export function getApplicantPositionLabel(applicant: Applicant) {
  return applicant.position?.title || applicant.positionId || 'No Position';
}

export function getApplicantFitScoreLabel(applicant: Applicant) {
  if (applicant.fitScore === null || applicant.fitScore === undefined) return 'No Score';

  const gradeInfo = getScoreGradeInfo(applicant.fitScore);
  return gradeInfo ? `${gradeInfo.letter} (${gradeInfo.range})` : 'No Score';
}

export function getParsedDataProperty(applicant: Applicant, propertyName: string) {
  const parsedData = parseApplicantParsedDataRecord(applicant.parsedData);
  const applicantInfo = parsedData.applicant_info;

  if (isRecord(applicantInfo)) {
    return applicantInfo[propertyName];
  }

  return parsedData[propertyName];
}

export function getApplicantDirectFieldValue(applicant: Applicant, field: string) {
  return (applicant as unknown as Record<string, unknown>)[field];
}

export function getKanbanValueLabel(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string').join(', ') || undefined;
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
