import { describe, expect, it, vi } from 'vitest';
import type { Attachment } from '@/lib/types';
import {
  buildHeadcountAttachmentDownloadUrl,
  buildHeadcountAttachmentStreamUrl,
  createSelectedHeadcountFilePreview,
  formatHeadcountAttachmentFileSize,
  getHeadcountAttachmentIconClassName,
} from './headcount-attachment-utils';

const attachment = {
  id: 'att-1',
  fileName: 'offer letter.pdf',
  filePath: 'headcount/files/offer letter.pdf',
  label: 'Offer',
  uploadedAt: '2026-01-01T00:00:00.000Z',
} as Attachment;

describe('headcount attachment utilities', () => {
  it('formats file sizes defensively', () => {
    expect(formatHeadcountAttachmentFileSize(null)).toBe('Unknown size');
    expect(formatHeadcountAttachmentFileSize(-1)).toBe('Unknown size');
    expect(formatHeadcountAttachmentFileSize(0)).toBe('0 Bytes');
    expect(formatHeadcountAttachmentFileSize(1024)).toBe('1 KB');
    expect(formatHeadcountAttachmentFileSize(1536)).toBe('1.5 KB');
  });

  it('classifies attachment icon color by file extension', () => {
    expect(getHeadcountAttachmentIconClassName('image.png')).toBe('text-primary');
    expect(getHeadcountAttachmentIconClassName('doc.pdf')).toBe('text-red-500');
    expect(getHeadcountAttachmentIconClassName('notes.txt')).toBe('text-muted-foreground');
  });

  it('builds encoded stream and download urls', () => {
    expect(buildHeadcountAttachmentStreamUrl(attachment, 'head-1')).toContain('headcountId=head-1');
    expect(buildHeadcountAttachmentStreamUrl(attachment, 'head-1')).toContain('offer+letter.pdf');
    expect(buildHeadcountAttachmentDownloadUrl(attachment, 'head-1')).toContain('/api/download?');
  });

  it('creates selected file previews', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    const file = new File(['x'], 'memo.txt', { type: 'text/plain' });

    expect(createSelectedHeadcountFilePreview(file)).toEqual({
      fileName: 'memo.txt',
      url: 'blob:preview',
      fileSize: 1,
    });
    createObjectURL.mockRestore();
  });
});
