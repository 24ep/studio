import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';

import {
  canAccessApplicantFile,
  canAccessHeadcountFile,
  type SecureFileSessionUser,
} from './secure-file-access-utils';
import { parseSecureFileExpiresIn, parseSecureFileRequest } from './secure-file-request';

function request(url: string) {
  return { url } as NextRequest;
}

function user(overrides: Partial<SecureFileSessionUser> = {}): SecureFileSessionUser {
  return {
    id: 'user-1',
    role: 'User',
    modulePermissions: [],
    ...overrides,
  };
}

describe('secure file route utilities', () => {
  it('parses request context and expiry defaults', () => {
    expect(parseSecureFileRequest(request(
      'https://example.com/api/secure-file?filePath=a/b.pdf&applicantId=app-1&expiresIn=120'
    ))).toEqual({
      filePath: 'a/b.pdf',
      applicantId: 'app-1',
      headcountId: null,
      expiresIn: 120,
    });

    expect(parseSecureFileExpiresIn(null)).toBe(3600);
    expect(parseSecureFileExpiresIn('bad')).toBe(3600);
  });

  it('decides applicant file access from admin, global, and own permissions', () => {
    expect(canAccessApplicantFile(user({ role: 'Admin' }), 'other')).toBe(true);
    expect(canAccessApplicantFile(user({ modulePermissions: ['applicantS_EDIT_BASIC'] }), 'other')).toBe(true);
    expect(canAccessApplicantFile(user({ modulePermissions: ['applicantS_EDIT_BASIC_OWN'] }), 'user-1')).toBe(true);
    expect(canAccessApplicantFile(user({ modulePermissions: ['applicantS_EDIT_BASIC_OWN'] }), 'other')).toBe(false);
    expect(canAccessApplicantFile(user(), 'user-1')).toBe(false);
  });

  it('decides headcount file access from admin, global, and own permissions', () => {
    expect(canAccessHeadcountFile(user({ role: 'Admin' }), 'other')).toBe(true);
    expect(canAccessHeadcountFile(user({ modulePermissions: ['POSITIONS_EDIT_SENSITIVE'] }), 'other')).toBe(true);
    expect(canAccessHeadcountFile(user({ modulePermissions: ['POSITIONS_EDIT_BASIC_OWN'] }), 'user-1')).toBe(true);
    expect(canAccessHeadcountFile(user({ modulePermissions: ['POSITIONS_EDIT_BASIC_OWN'] }), 'other')).toBe(false);
    expect(canAccessHeadcountFile(user(), 'user-1')).toBe(false);
  });
});
