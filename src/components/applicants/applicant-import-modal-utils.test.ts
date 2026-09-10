import { describe, expect, it } from 'vitest';
import {
  formatApplicantImportValidationDetail,
  getApplicantImportErrorMessage,
  getApplicantImportSuccessMessage,
  isSupportedApplicantImportFile,
  normalizeApplicantImportResults,
} from './applicant-import-modal-utils';

describe('applicant import modal utilities', () => {
  it('detects supported import file extensions', () => {
    expect(isSupportedApplicantImportFile('applicants.xlsx')).toBe(true);
    expect(isSupportedApplicantImportFile('legacy.xls')).toBe(false);
    expect(isSupportedApplicantImportFile('applicants.XLSX')).toBe(true);
    expect(isSupportedApplicantImportFile('applicants.csv')).toBe(true);
    expect(isSupportedApplicantImportFile('applicants.pdf')).toBe(false);
  });

  it('normalizes import result payloads defensively', () => {
    expect(normalizeApplicantImportResults({
      results: {
        created: 2,
        updated: 1,
        skipped: 3,
        errors: ['Bad row', 1, null],
      },
    })).toEqual({
      created: 2,
      updated: 1,
      skipped: 3,
      errors: ['Bad row'],
    });
  });

  it('formats validation details and messages', () => {
    expect(formatApplicantImportValidationDetail({
      row: 4,
      email: 'a@example.test',
      errors: {
        name: ['Name is required'],
        status: 'Unknown status',
      },
    })).toBe('Row 4 (a@example.test): Name is required, Unknown status');

    expect(getApplicantImportSuccessMessage({
      created: 1,
      updated: 2,
      skipped: 0,
      errors: [],
    })).toBe('Import completed successfully! Created: 1, Updated: 2');

    expect(getApplicantImportErrorMessage(new Error('No file'))).toBe('No file');
  });
});
