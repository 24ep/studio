export type JobAppliedApplicantRow = {
  parsedData?: Record<string, unknown> | null;
  assignmentJustification?: string[] | string | null;
};

export function formatAssignmentJustification(value: string[] | string | null | undefined) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return typeof value === 'string'
    ? value.split(/[\n\r]+/).filter((item: string) => item.trim() !== '')
    : [];
}

export function getJobAppliedResponseData(applicant: JobAppliedApplicantRow) {
  const parsedData = applicant.parsedData || {};

  return {
    job_applied: parsedData.job_applied || null,
    assignmentJustification: formatAssignmentJustification(applicant.assignmentJustification),
  };
}

export function normalizeJustification(value: string[] | undefined) {
  return Array.isArray(value)
    ? value
    : value
      ? String(value).split(/[\n\r]+/).filter((item: string) => item.trim() !== '')
      : [];
}
