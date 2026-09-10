import { describe, expect, it } from 'vitest';
import {
  buildFilePreviewUrl,
  canPreviewFile,
  formatFileSize,
  getFileType,
  getSafeFileOpenUrl,
  isImageFile,
  isPdfFile,
} from './file-viewer-modal-utils';

describe('file-viewer-modal-utils', () => {
  it('detects previewable image and PDF files', () => {
    expect(canPreviewFile('resume.pdf')).toBe(true);
    expect(canPreviewFile('photo.webp')).toBe(true);
    expect(canPreviewFile('notes.docx')).toBe(false);
    expect(isImageFile('avatar.png')).toBe(true);
    expect(isImageFile('avatar.pdf')).toBe(false);
    expect(isPdfFile('resume.pdf')).toBe(true);
    expect(isPdfFile('resume.png')).toBe(false);
  });

  it('formats file types and sizes', () => {
    expect(getFileType('photo.jpeg')).toBe('Image');
    expect(getFileType('resume.pdf')).toBe('PDF Document');
    expect(getFileType('sheet.xlsx')).toBe('Excel Spreadsheet');
    expect(getFileType('unknown.bin')).toBe('Document');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(`${1024 * 1024}`)).toBe('1.0 MB');
    expect(formatFileSize(0)).toBe('Unknown size');
  });

  it('builds secure preview URLs from file paths and legacy stream URLs', () => {
    expect(buildFilePreviewUrl({
      fileName: 'resume.pdf',
      url: '/unused',
      filePath: 'applicants/a/resume.pdf',
      applicantId: 'applicant-1',
    })).toBe('/api/secure-file/preview?filePath=applicants%2Fa%2Fresume.pdf&fileName=resume.pdf&applicantId=applicant-1');

    expect(buildFilePreviewUrl({
      fileName: 'resume.pdf',
      url: '/api/secure-file/stream?filePath=x',
    })).toBe('/api/secure-file/preview?filePath=x');
  });

  it('sanitizes open-in-new-tab URLs', () => {
    expect(getSafeFileOpenUrl(null, '/api/secure-file/preview?filePath=x')).toBe('/api/secure-file/preview?filePath=x');
    expect(getSafeFileOpenUrl({ fileName: 'x.pdf', url: 'javascript:alert(1)' }, '')).toBeNull();
  });
});
