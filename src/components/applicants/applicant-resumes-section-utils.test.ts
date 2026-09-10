import { describe, expect, it } from 'vitest';

import type { ApplicantAttachment } from './applicant-attachment-utils';
import {
  buildApplicantAttachmentPreviewUrl,
  buildApplicantResumeViewerFile,
  isImageAttachment,
  isPdfAttachment,
  sortApplicantAttachmentsByDate,
} from './applicant-resumes-section-utils';

function attachment(input: Partial<ApplicantAttachment>): ApplicantAttachment {
  return {
    id: input.id ?? 'attachment-1',
    fileName: input.fileName ?? 'resume.pdf',
    url: input.url ?? '/api/secure-file/stream?filePath=resume.pdf',
    label: input.label,
    isPrimary: input.isPrimary,
    updatedAt: input.updatedAt,
    uploadedAt: input.uploadedAt,
    fileSize: input.fileSize,
    filePath: input.filePath,
    applicantId: input.applicantId,
  } as ApplicantAttachment;
}

describe('applicant resume section utilities', () => {
  it('detects preview URL and common attachment types', () => {
    expect(buildApplicantAttachmentPreviewUrl('/api/secure-file/stream?filePath=a.pdf'))
      .toBe('/api/secure-file/preview?filePath=a.pdf');
    expect(buildApplicantAttachmentPreviewUrl('/api/secure-file/preview?filePath=a.pdf'))
      .toBe('/api/secure-file/preview?filePath=a.pdf');
    expect(isImageAttachment('photo.WEBP')).toBe(true);
    expect(isImageAttachment('resume.pdf')).toBe(false);
    expect(isPdfAttachment('resume.PDF')).toBe(true);
  });

  it('sorts attachments by updated date with stable invalid-date handling', () => {
    const sortedDesc = sortApplicantAttachmentsByDate([
      attachment({ id: 'old', updatedAt: '2026-01-01T00:00:00.000Z' }),
      attachment({ id: 'new', updatedAt: '2026-02-01T00:00:00.000Z' }),
    ], true);

    expect(sortedDesc.map(item => item.id)).toEqual(['new', 'old']);
    expect(sortApplicantAttachmentsByDate(null, true)).toEqual([]);
    expect(sortApplicantAttachmentsByDate([
      attachment({ id: 'a', updatedAt: 'bad' }),
      attachment({ id: 'b', updatedAt: '2026-01-01T00:00:00.000Z' }),
    ], true).map(item => item.id)).toEqual(['a', 'b']);
  });

  it('builds file viewer payloads with applicant fallback', () => {
    expect(buildApplicantResumeViewerFile(attachment({
      fileName: 'cv.pdf',
      label: 'Resume',
      fileSize: 1234,
      filePath: '/uploads/cv.pdf',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }), 'fallback-applicant')).toMatchObject({
      fileName: 'cv.pdf',
      label: 'Resume',
      fileSize: 1234,
      filePath: '/uploads/cv.pdf',
      updatedAt: '2026-01-01T00:00:00.000Z',
      applicantId: 'fallback-applicant',
    });
  });
});
