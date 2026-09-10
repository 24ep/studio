type JsonRecord = Record<string, unknown>;

export {
  extractFromParsedData,
  formatAssignmentJustification,
  formatDateForExport,
  formatJobMatches,
  truncateForExcel,
  type ApplicantJobMatchForExport,
} from '../../applicant-export-utils';

import {
  extractFromParsedData,
  formatAssignmentJustification,
  formatDateForExport,
  formatFitScoreForExport,
  formatJobMatches,
  stringifyJsonForExcel,
  truncateForExcel,
  type ApplicantJobMatchForExport,
} from '../../applicant-export-utils';

export type ApplicantForExport = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  positionId?: string | null;
  positionTitle?: string | null;
  recruiterId?: string | null;
  recruiterName?: string | null;
  fitScore?: number | null;
  statusName?: string | null;
  applicationDate?: string | Date | null;
  assignmentJustification?: unknown;
  parsedData?: JsonRecord | null;
  customAttributes?: unknown;
};

export function transformApplicantForExport(
  applicant: ApplicantForExport,
  jobMatches: readonly ApplicantJobMatchForExport[]
): Record<string, string> {
  const parsedData = applicant.parsedData ?? {};

  return {
    'ID': applicant.id || '',
    'Name*': applicant.name || '',
    'Email*': applicant.email || '',
    'Phone': applicant.phone || '',
    'Position ID': applicant.positionId || '',
    'Position Name': applicant.positionTitle || '',
    'Recruiter ID': applicant.recruiterId || '',
    'Recruiter Name': applicant.recruiterName || '',
    'Fit Score (0-100)': formatFitScoreForExport(applicant.fitScore),
    'Status*': applicant.statusName || 'Unknown',
    'Application Date': formatDateForExport(applicant.applicationDate),
    'Applied Job': applicant.positionTitle || '',
    'Applied Job Justification': truncateForExcel(formatAssignmentJustification(applicant.assignmentJustification)),
    'Job Matches': truncateForExcel(formatJobMatches(jobMatches)),
    'Location': truncateForExcel(extractFromParsedData(parsedData, 'personal_info.location') || ''),
    'Introduction/About Me': truncateForExcel(extractFromParsedData(parsedData, 'personal_info.introduction_aboutme') || ''),
    'Education (JSON)': stringifyJsonForExcel(parsedData.education),
    'Experience (JSON)': stringifyJsonForExcel(parsedData.experience),
    'Skills (JSON)': stringifyJsonForExcel(parsedData.skills),
    'Job Suitable (JSON)': stringifyJsonForExcel(parsedData.job_suitable),
    'Custom Attributes (JSON)': stringifyJsonForExcel(applicant.customAttributes),
  };
}
