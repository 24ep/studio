import ExcelJS from 'exceljs';

const APPLICANT_EXPORT_COLUMNS = [
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
  { header: 'Job Matches', key: 'Job Matches', width: 60 },
  { header: 'Location', key: 'Location', width: 20 },
  { header: 'Introduction/About Me', key: 'Introduction/About Me', width: 40 },
  { header: 'Education (JSON)', key: 'Education (JSON)', width: 50 },
  { header: 'Experience (JSON)', key: 'Experience (JSON)', width: 50 },
  { header: 'Skills (JSON)', key: 'Skills (JSON)', width: 50 },
  { header: 'Job Suitable (JSON)', key: 'Job Suitable (JSON)', width: 50 },
  { header: 'Custom Attributes (JSON)', key: 'Custom Attributes (JSON)', width: 50 },
];

type ApplicantExportRow = Record<string, string | number | boolean | Date | null | undefined>;

export async function buildApplicantExportWorkbookBuffer(exportRows: ApplicantExportRow[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Applicant Details');

  worksheet.columns = APPLICANT_EXPORT_COLUMNS;
  worksheet.addRows(exportRows);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildApplicantExportHeaders(applicantName: string) {
  const exportDate = new Date().toISOString().split('T')[0];

  return {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="applicant_${applicantName}_${exportDate}.xlsx"`,
  };
}
