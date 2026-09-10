type ExportCellValue = string | number | boolean | Date | null | undefined;
export type ApplicantsExportRow = Record<string, ExportCellValue>;

import {
  extractFromParsedData,
  formatAssignmentJustification,
  formatDateForExport,
  formatFitScoreForExport,
  formatJobMatches,
  isExportJsonRecord,
  stringifyJsonForExcel,
  truncateForExcel,
  type ApplicantJobMatchForExport,
} from '../applicant-export-utils';

export type ApplicantExportSourceRow = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  positionId?: string | null;
  position_title?: string | null;
  recruiterId?: string | null;
  recruiter_name?: string | null;
  fitScore?: number | null;
  status_name?: string | null;
  applicationDate?: string | Date | null;
  assignmentJustification?: unknown;
  job_matches?: ApplicantJobMatchForExport[] | null;
  parsedData?: unknown;
  customAttributes?: unknown;
};

const PARSED_DATA_PATH_FIELDS = [
  ['Location', 'personal_info.location'],
  ['Introduction/About Me', 'personal_info.introduction_aboutme'],
] as const;

const PARSED_DATA_JSON_FIELDS = [
  ['Education (JSON)', 'education'],
  ['Experience (JSON)', 'experience'],
  ['Skills (JSON)', 'skills'],
  ['Job Suitable (JSON)', 'job_suitable'],
] as const;

function buildParsedDataExportFields(parsedData: Record<string, unknown>): ApplicantsExportRow {
  return {
    ...Object.fromEntries(PARSED_DATA_PATH_FIELDS.map(([header, path]) => [
      header,
      truncateForExcel(extractFromParsedData(parsedData, path) || ''),
    ])),
    ...Object.fromEntries(PARSED_DATA_JSON_FIELDS.map(([header, key]) => [
      header,
      stringifyJsonForExcel(parsedData[key]),
    ])),
  };
}

export function transformApplicantForExport(
  applicant: ApplicantExportSourceRow,
  isJobMatchEnabled: boolean
): ApplicantsExportRow {
  const parsedData = isExportJsonRecord(applicant.parsedData) ? applicant.parsedData : {};

  return {
    ID: applicant.id || '',
    'Name*': applicant.name || '',
    'Email*': applicant.email || '',
    Phone: applicant.phone || '',
    'Position ID': applicant.positionId || '',
    'Position Name': applicant.position_title || '',
    'Recruiter ID': applicant.recruiterId || '',
    'Recruiter Name': applicant.recruiter_name || '',
    'Fit Score (0-100)': formatFitScoreForExport(applicant.fitScore),
    'Status*': applicant.status_name || 'Unknown',
    'Application Date': formatDateForExport(applicant.applicationDate),
    'Applied Job': applicant.position_title || '',
    'Applied Job Justification': truncateForExcel(formatAssignmentJustification(applicant.assignmentJustification)),
    ...(isJobMatchEnabled && { 'Job Matches': truncateForExcel(formatJobMatches(applicant.job_matches || [])) }),
    ...buildParsedDataExportFields(parsedData),
    'Custom Attributes (JSON)': stringifyJsonForExcel(applicant.customAttributes),
  };
}
