import ExcelJS from 'exceljs';

const TEMPLATE_ROW = {
  'ID': '',
  'Name*': '',
  'Email*': '',
  'Phone': '',
  'Position ID': '',
  'Position Name': '',
  'Recruiter ID': '',
  'Recruiter Name': '',
  'Fit Score (0-100)': '',
  'Status*': 'Applied',
  'Status ID': '',
  'Application Date': '',
  'Applied Job': '',
  'Applied Job Justification': '',
  'Job Matches': '',
  'Location': '',
  'Introduction/About Me': '',
  'Education (JSON)': '',
  'Experience (JSON)': '',
  'Skills (JSON)': '',
  'Job Suitable (JSON)': '',
  'Custom Attributes (JSON)': '',
};

const TEMPLATE_COLUMNS = [
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
  { header: 'Status ID', key: 'Status ID', width: 36 },
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

const INSTRUCTIONS_DATA = [
  { 'Field': 'ID', 'Required': 'No', 'Description': 'Leave blank for new Applicants. Provide existing UUID for updates.' },
  { 'Field': 'Name*', 'Required': 'Yes', 'Description': 'Full name of the Applicant' },
  { 'Field': 'Email*', 'Required': 'Yes', 'Description': 'Valid email address (must be unique)' },
  { 'Field': 'Phone', 'Required': 'No', 'Description': 'Phone number (optional)' },
  { 'Field': 'Position ID', 'Required': 'No', 'Description': 'UUID of the position (optional)' },
  { 'Field': 'Position Name', 'Required': 'No', 'Description': 'Display name of position (for reference)' },
  { 'Field': 'Recruiter ID', 'Required': 'No', 'Description': 'UUID of the recruiter (optional)' },
  { 'Field': 'Recruiter Name', 'Required': 'No', 'Description': 'Display name of recruiter (for reference)' },
  { 'Field': 'Fit Score (0-100)', 'Required': 'No', 'Description': 'Fit score as percentage (0-100)' },
  { 'Field': 'Status*', 'Required': 'Yes', 'Description': 'Applicant status name (Applied, Interviewing, Hired, etc.)' },
  { 'Field': 'Status ID', 'Required': 'No', 'Description': 'RecruitmentStage UUID. Takes precedence over Status* when provided.' },
  { 'Field': 'Application Date', 'Required': 'No', 'Description': 'Date in YYYY-MM-DD format' },
  { 'Field': 'Applied Job', 'Required': 'No', 'Description': 'Title of the applied job' },
  { 'Field': 'Applied Job Justification', 'Required': 'No', 'Description': 'Justification for job application' },
  { 'Field': 'Job Matches', 'Required': 'No', 'Description': 'Additional job matches with scores and reasons' },
  { 'Field': 'Location', 'Required': 'No', 'Description': 'Applicant location' },
  { 'Field': 'Introduction/About Me', 'Required': 'No', 'Description': 'Applicant introduction or about section' },
  { 'Field': 'Education (JSON)', 'Required': 'No', 'Description': 'Education history as JSON array' },
  { 'Field': 'Experience (JSON)', 'Required': 'No', 'Description': 'Work experience as JSON array' },
  { 'Field': 'Skills (JSON)', 'Required': 'No', 'Description': 'Skills as JSON array' },
  { 'Field': 'Job Suitable (JSON)', 'Required': 'No', 'Description': 'Suitable jobs as JSON array' },
  { 'Field': 'Custom Attributes (JSON)', 'Required': 'No', 'Description': 'Custom attributes as JSON object' },
];

export async function buildApplicantImportTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const dataWorksheet = workbook.addWorksheet('Import Template');
  dataWorksheet.columns = TEMPLATE_COLUMNS;
  dataWorksheet.addRows([TEMPLATE_ROW]);

  const instructionsWorksheet = workbook.addWorksheet('Instructions');
  instructionsWorksheet.columns = [
    { header: 'Field', key: 'Field', width: 25 },
    { header: 'Required', key: 'Required', width: 10 },
    { header: 'Description', key: 'Description', width: 60 },
  ];
  instructionsWorksheet.addRows(INSTRUCTIONS_DATA);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
