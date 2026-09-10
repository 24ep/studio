import { describe, expect, it } from 'vitest';
import {
  buildMissingAttachmentUploadMessage,
  extractAttachmentFileName,
  getCaseInsensitiveHeader,
  inferAttachmentContentType,
  isAllowedAttachmentDownloadDomain,
  isBlockedAttachmentDownloadHost,
  isValidAttachmentFileUrl,
  parseAttachmentDownloadHeaders,
  selectAttachmentUploadFile,
} from './attachments-route-pure-utils';

describe('attachments-route-utils', () => {
  it('infers common attachment content types from file paths', () => {
    expect(inferAttachmentContentType('resume.pdf')).toBe('application/pdf');
    expect(inferAttachmentContentType('photo.JPG')).toBe('image/jpeg');
    expect(inferAttachmentContentType('sheet.xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(inferAttachmentContentType('archive.unknown')).toBe('application/octet-stream');
  });

  it('blocks localhost, metadata, and private network download hosts', () => {
    expect(isBlockedAttachmentDownloadHost('localhost')).toBe(true);
    expect(isBlockedAttachmentDownloadHost('169.254.169.254')).toBe(true);
    expect(isBlockedAttachmentDownloadHost('10.1.2.3')).toBe(true);
    expect(isBlockedAttachmentDownloadHost('172.20.0.10')).toBe(true);
    expect(isBlockedAttachmentDownloadHost('192.168.1.5')).toBe(true);
    expect(isBlockedAttachmentDownloadHost('files.example.com')).toBe(false);
  });

  it('allows same-origin domains or configured download domains', () => {
    expect(isAllowedAttachmentDownloadDomain('example.com', '', [])).toBe(false);
    expect(isAllowedAttachmentDownloadDomain('cdn.example.com', '', [])).toBe(false);
    expect(isAllowedAttachmentDownloadDomain('app.example.com', 'app.example.com', [])).toBe(true);
    expect(isAllowedAttachmentDownloadDomain('files.example.com', 'app.example.com', ['example.com'])).toBe(true);
    expect(isAllowedAttachmentDownloadDomain('evil.test', 'app.example.com', [])).toBe(false);
  });

  it('reads headers case-insensitively', () => {
    expect(getCaseInsensitiveHeader({ Authorization: 'Bearer token' }, 'authorization')).toBe('Bearer token');
    expect(getCaseInsensitiveHeader({ cookie: 'a=b' }, 'Cookie')).toBe('a=b');
    expect(getCaseInsensitiveHeader(undefined, 'Cookie')).toBeUndefined();
  });

  it('extracts attachment filenames from path or content-disposition', () => {
    const directUrl = new URL('https://files.example.com/uploads/cv.pdf');
    expect(extractAttachmentFileName(directUrl, new Response('ok'))).toBe('cv.pdf');

    const response = new Response('ok', {
      headers: { 'content-disposition': 'attachment; filename="candidate.docx"' },
    });
    expect(extractAttachmentFileName(new URL('https://files.example.com/download'), response)).toBe('candidate.docx');
  });

  it('selects attachment upload files from supported form fields', () => {
    const primary = new File(['resume'], 'resume.pdf');
    const fallback = new File(['certificate'], 'certificate.pdf');
    const formData = new FormData();
    formData.set('attachment', primary);
    formData.append('attachments', fallback);

    expect(selectAttachmentUploadFile(formData)).toBe(primary);

    const fallbackFormData = new FormData();
    fallbackFormData.append('attachments', fallback);
    expect(selectAttachmentUploadFile(fallbackFormData)).toBe(fallback);
    expect(buildMissingAttachmentUploadMessage(new FormData())).toContain('Expected field name: "attachment" or "attachments"');
  });

  it('parses URL upload headers and auth tokens', () => {
    expect(parseAttachmentDownloadHeaders({
      headers: { Authorization: 'Bearer token' },
    })).toEqual({
      ok: true,
      headers: { Authorization: 'Bearer token' },
    });
    expect(parseAttachmentDownloadHeaders({ authToken: 'token' })).toEqual({
      ok: true,
      headers: { Authorization: 'Bearer token' },
    });
    expect(parseAttachmentDownloadHeaders({ headers: { Authorization: 123 } })).toEqual({
      ok: false,
      message: 'Header "Authorization" must be a string value. Received number. If you\'re passing an Authorization token, make sure it\'s quoted: "Authorization": "Bearer <token>"',
    });
  });

  it('validates URL upload URL format', () => {
    expect(isValidAttachmentFileUrl('https://files.example.com/cv.pdf')).toBe(true);
    expect(isValidAttachmentFileUrl('not a url')).toBe(false);
  });
});
