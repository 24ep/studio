import { describe, expect, it } from 'vitest';
import { resolveDownloadFileName, sanitizeDownloadFileName } from './download-route-response';

describe('download route response helpers', () => {
  it('sanitizes unsafe file names', () => {
    expect(sanitizeDownloadFileName('../report final.pdf')).toBe('.._report_final.pdf');
    expect(sanitizeDownloadFileName('candidate#1.docx')).toBe('candidate_1.docx');
  });

  it('resolves explicit and file path derived names', () => {
    expect(resolveDownloadFileName({
      applicantId: null,
      fileName: 'custom name.pdf',
      filePath: 'uploads/original.pdf',
      fileUrl: null,
      headcountId: null,
    })).toBe('custom_name.pdf');
    expect(resolveDownloadFileName({
      applicantId: null,
      fileName: null,
      filePath: 'uploads/original.pdf',
      fileUrl: null,
      headcountId: null,
    })).toBe('original.pdf');
  });
});
