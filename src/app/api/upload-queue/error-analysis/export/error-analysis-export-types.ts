export type ErrorAnalysisExportFormat = 'csv' | 'excel';

export type ErrorAnalysisExportFilters = {
  dateStart: string | null;
  dateEnd: string | null;
  status: string | null;
  errorReason: string | null;
  format: ErrorAnalysisExportFormat;
};

export type ErrorAnalysisQueueRow = {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  error: string | null;
  error_details: string | null;
  upload_date: string | Date | null;
  process_date: string | Date | null;
  completed_date: string | Date | null;
  position_title: string | null;
  source: string | null;
};

export type ErrorAnalysisSummaryRow = {
  'No.': number;
  'Error Reason': string;
  'Error Category': string;
  'Count': number;
  'Percentage': string;
  'Severity': 'high' | 'medium' | 'low';
  'Total Jobs': number;
  'Export Date': string;
};

export type ErrorAnalysisDetailRow = {
  'Error Reason': string;
  'Error Category': string;
  'File Name': string;
  'File Size (bytes)': number;
  'Status': string;
  'Upload Date': string | Date | null;
  'Process Date': string | Date | null;
  'Completed Date': string | Date | null;
  'Position Title': string | null;
  'Source': string | null;
  'Error Message': string | null;
  'Error Details': string | null;
};
