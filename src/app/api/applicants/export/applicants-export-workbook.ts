import ExcelJS from 'exceljs';

import type { ApplicantsExportRow } from './applicants-export-row';

type ApplicantsExportColumn = {
  header: string;
  key: string;
  width: number;
};

const BASE_APPLICANTS_EXPORT_COLUMNS: ApplicantsExportColumn[] = [
  { header: 'ID', key: 'ID', width: 36 },
  { header: 'Name*', key: 'Name*', width: 20 },
  { header: 'Email*', key: 'Email*', width: 25 },
  { header: 'Phone', key: 'Phone', width: 15 },
  { header: 'Position ID', key: 'Position ID', width: 36 },
  { header: 'Position Name', key: 'Position Name', width: 30 },
  { header: 'Recruiter ID', key: 'Recruiter ID', width: 36 },
  { header: 'Recruiter Name', key: 'Recruiter Name', width: 25 },
  { header: 'Fit Score (0-100)', key: 'Fit Score (0-100)', width: 15 },
  { header: 'Status*', key: 'Status*', width: 15 },
  { header: 'Application Date', key: 'Application Date', width: 15 },
  { header: 'Applied Job', key: 'Applied Job', width: 30 },
  { header: 'Applied Job Justification', key: 'Applied Job Justification', width: 50 },
];

const JOB_MATCH_EXPORT_COLUMN: ApplicantsExportColumn = {
  header: 'Job Matches',
  key: 'Job Matches',
  width: 60,
};

const APPLICANTS_PROFILE_EXPORT_COLUMNS: ApplicantsExportColumn[] = [
  { header: 'Location', key: 'Location', width: 20 },
  { header: 'Introduction/About Me', key: 'Introduction/About Me', width: 40 },
  { header: 'Education (JSON)', key: 'Education (JSON)', width: 50 },
  { header: 'Experience (JSON)', key: 'Experience (JSON)', width: 50 },
  { header: 'Skills (JSON)', key: 'Skills (JSON)', width: 50 },
  { header: 'Job Suitable (JSON)', key: 'Job Suitable (JSON)', width: 50 },
  { header: 'Custom Attributes (JSON)', key: 'Custom Attributes (JSON)', width: 50 },
];

export function getApplicantsExportColumns(isJobMatchEnabled: boolean) {
  return [
    ...BASE_APPLICANTS_EXPORT_COLUMNS,
    ...(isJobMatchEnabled ? [JOB_MATCH_EXPORT_COLUMN] : []),
    ...APPLICANTS_PROFILE_EXPORT_COLUMNS,
  ];
}

export async function createApplicantsExportExcelBuffer(
  exportData: ApplicantsExportRow[],
  isJobMatchEnabled: boolean
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const dataWorksheet = workbook.addWorksheet('Applicants Export');

  dataWorksheet.columns = getApplicantsExportColumns(isJobMatchEnabled);
  dataWorksheet.addRows(exportData);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
