import type { QueryResultRow } from 'pg';

export type ApplicantExportJobMatch = {
  jobTitle?: string | null;
  fitScore?: number | null;
  matchReasons?: string[] | null;
};

export type ApplicantExportRow = QueryResultRow & {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  positionTitle?: string | null;
  positionDepartment?: string | null;
  recruiterName?: string | null;
  fitScore?: number | null;
  applicationDate?: Date | string | null;
  updatedAt?: Date | string | null;
  assignmentJustification?: unknown;
  job_matches?: ApplicantExportJobMatch[] | null;
};

const APPLICANTS_EXPORT_HEADERS = [
  'ID',
  'Name',
  'Email',
  'Phone',
  'Status',
  'Position',
  'Department',
  'Recruiter',
  'Fit Score',
  'Application Date',
  'Updated At',
  'Applied Job',
  'Applied Job Justification',
  'Job Matches',
];

export function formatAssignmentJustification(justification: unknown): string {
  if (!justification) return '';

  if (Array.isArray(justification)) {
    return justification.filter(Boolean).join('; ');
  }

  if (typeof justification === 'string') {
    return justification.split('\n').map((line) => line.trim()).filter(Boolean).join('; ');
  }

  return '';
}

export function formatJobMatches(jobMatches: ApplicantExportJobMatch[] = []): string {
  if (jobMatches.length === 0) return '';

  return jobMatches.map(formatJobMatch).join('; ');
}

export function buildApplicantsV1ExportCsv(rows: ApplicantExportRow[]) {
  return [
    APPLICANTS_EXPORT_HEADERS.join(','),
    ...rows.map(buildApplicantExportCsvRow),
  ].join('\n');
}

function buildApplicantExportCsvRow(row: ApplicantExportRow) {
  return [
    row.id,
    csvEscape(row.name),
    row.email || '',
    row.phone || '',
    row.status || '',
    csvEscape(row.positionTitle),
    csvEscape(row.positionDepartment),
    csvEscape(row.recruiterName),
    row.fitScore || '',
    row.applicationDate || '',
    row.updatedAt || '',
    csvEscape(row.positionTitle),
    csvEscape(formatAssignmentJustification(row.assignmentJustification)),
    csvEscape(formatJobMatches(row.job_matches || [])),
  ].join(',');
}

function formatJobMatch(match: ApplicantExportJobMatch) {
  const parts: string[] = [];
  if (match.jobTitle) parts.push(`Job: ${match.jobTitle}`);
  if (match.fitScore !== null && match.fitScore !== undefined) parts.push(`Score: ${Math.round(match.fitScore * 100)}%`);
  if (match.matchReasons && match.matchReasons.length > 0) parts.push(`Reasons: ${match.matchReasons.join(', ')}`);
  return parts.join(' | ');
}

function csvEscape(value: unknown) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}
