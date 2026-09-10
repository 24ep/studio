import { describe, expect, it } from 'vitest';

import { getImportFileError } from './data-operations-api';

describe('data operations file validation', () => {
  it('accepts the formats supported by each production importer', () => {
    expect(getImportFileError('applicants', { name: 'applicants.xlsx', size: 100, type: '' } as File)).toBeNull();
    expect(getImportFileError('applicants', { name: 'applicants.csv', size: 100, type: 'text/csv' } as File)).toBeNull();
    expect(getImportFileError('positions', { name: 'POSITIONS.CSV', size: 100, type: '' } as File)).toBeNull();
    expect(getImportFileError('system-transfer', { name: 'transfer.jsonl', size: 100, type: 'application/json' } as File)).toBeNull();
  });

  it('rejects unsupported formats and oversized files before upload', () => {
    expect(getImportFileError('applicants', { name: 'legacy.xls', size: 100, type: '' } as File)).toBe('Choose an Excel (.xlsx) or CSV file.');
    expect(getImportFileError('positions', { name: 'positions.xlsx', size: 100, type: '' } as File)).toBe('Please select a CSV file (.csv). Only CSV files are supported.');
    expect(getImportFileError('system-transfer', { name: 'backup.csv', size: 100, type: '' } as File)).toBe('Please select an HRI system data transfer package.');
    expect(getImportFileError('applicants', { name: 'large.csv', size: 101 * 1024 * 1024, type: 'text/csv' } as File)).toBe('File too large. The platform cannot accept files larger than 100 MB.');
  });
});
