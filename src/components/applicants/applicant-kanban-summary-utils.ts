import type { Applicant } from '../../lib/types';
import { getApplicantParsedArrayField, parseApplicantParsedDataRecord } from './applicant-parsed-data-utils';

const APPLICANT_PARSED_ARRAY_FIELDS = [
  'job_matches',
  'education',
  'experience',
  'skills',
  'job_suitable',
] as const;

export function normalizeApplicantParsedDataForSummary(parsedData: Applicant['parsedData']) {
  const parsedDataRecord = parseApplicantParsedDataRecord(parsedData);
  if (Object.keys(parsedDataRecord).length === 0) return {};

  const normalized: Record<string, unknown> = { ...parsedDataRecord };

  for (const field of APPLICANT_PARSED_ARRAY_FIELDS) {
    normalized[field] = getApplicantParsedArrayField(parsedDataRecord, field);
  }

  return normalized;
}

export function buildApplicantKanbanSummary(applicant: Applicant, formatName: (applicant: Applicant) => string) {
  return {
    id: applicant.id,
    name: formatName(applicant),
    email: applicant.email,
    phone: applicant.phone,
    status: applicant.statusId,
    position: applicant.position,
    fitScore: applicant.fitScore,
    parsedData: normalizeApplicantParsedDataForSummary(applicant.parsedData),
  };
}
