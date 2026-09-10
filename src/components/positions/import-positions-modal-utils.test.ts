import { describe, expect, it } from 'vitest';

import {
  buildPositionsTemplateCsvContent,
  getPositionImportFileValidationError,
  getPositionImportStatusText,
  getPositionImportSuccessMessage,
  normalizePositionImportResult,
} from './import-positions-modal-utils';

describe('import positions modal utils', () => {
  it('normalizes import responses with defaults', () => {
    expect(normalizePositionImportResult({
      success: 2,
      failed: 1,
      processingTime: 1200,
      errors: ['Duplicate title', 404],
      message: 'done',
    })).toEqual({
      success: 2,
      failed: 1,
      processingTime: 1200,
      errors: ['Duplicate title'],
      message: 'done',
    });
  });

  it('validates import file type and size', () => {
    expect(getPositionImportFileValidationError({ name: 'positions.csv', type: '', size: 100 })).toBeNull();
    expect(getPositionImportFileValidationError({ name: 'positions.txt', type: 'text/plain', size: 100 }))
      .toBe('Please select a CSV file (.csv). Only CSV files are supported.');
    expect(getPositionImportFileValidationError({ name: 'large.csv', type: 'text/csv', size: 11 * 1024 * 1024 }))
      .toBe('File too large. Maximum size is 10MB');
  });

  it('builds template CSV and status copy', () => {
    const csv = buildPositionsTemplateCsvContent();

    expect(csv.startsWith('\uFEFFtitle,department,description')).toBe(true);
    expect(csv).toContain('"Software Engineer"');
    expect(csv).not.toContain('NOTE:');
    expect(getPositionImportStatusText('processing')).toBe('Processing positions...');
    expect(getPositionImportStatusText('idle')).toBe('Upload & Import');
  });

  it('formats success messages with timing and warnings', () => {
    expect(getPositionImportSuccessMessage({
      success: 3,
      failed: 1,
      processingTime: 1500,
      errors: ['missing department'],
    })).toBe('Import completed successfully! 3 positions imported, 1 failed. Processing time: 1.5s Warnings: missing department');
  });
});
