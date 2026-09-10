import { describe, expect, it } from 'vitest';

import {
  buildAttachmentDownloadHttpErrorMessage,
  type AttachmentDownloadErrorContext,
} from './attachments-route-download-errors';

function makeContext(overrides: Partial<AttachmentDownloadErrorContext> = {}): AttachmentDownloadErrorContext {
  return {
    url: 'https://files.example.com/file.pdf',
    urlHost: 'files.example.com',
    currentHost: 'app.example.com',
    isDifferentEnvironment: true,
    isSecureFileUrl: false,
    hasCookie: false,
    hasAuthorization: false,
    authPreview: 'not provided',
    ...overrides,
  };
}

describe('attachments route download errors', () => {
  it('explains missing authentication for non-secure-file 401 responses', () => {
    expect(buildAttachmentDownloadHttpErrorMessage({
      status: 401,
      statusText: 'Unauthorized',
      context: makeContext(),
    })).toContain('requires authentication');
  });

  it('explains secure-file cookie requirements for 401 responses', () => {
    expect(buildAttachmentDownloadHttpErrorMessage({
      status: 401,
      statusText: 'Unauthorized',
      context: makeContext({ isSecureFileUrl: true }),
    })).toContain('requires session-based authentication');

    expect(buildAttachmentDownloadHttpErrorMessage({
      status: 401,
      statusText: 'Unauthorized',
      context: makeContext({ isSecureFileUrl: true, hasCookie: true }),
    })).toContain('returned 401 even with cookies provided');
  });

  it('adds cross-environment guidance for secure-file 403 responses', () => {
    expect(buildAttachmentDownloadHttpErrorMessage({
      status: 403,
      statusText: 'Forbidden',
      context: makeContext({ isSecureFileUrl: true }),
    })).toContain('Cross-environment file access requires');
  });

  it('keeps 404 and fallback messages concise', () => {
    expect(buildAttachmentDownloadHttpErrorMessage({
      status: 404,
      statusText: 'Not Found',
      context: makeContext(),
    })).toContain('file was not found');

    expect(buildAttachmentDownloadHttpErrorMessage({
      status: 500,
      statusText: 'Server Error',
      context: makeContext(),
    })).toBe('Failed to download file: 500 Server Error');
  });
});
