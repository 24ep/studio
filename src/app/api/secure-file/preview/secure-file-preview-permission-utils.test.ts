import { describe, expect, it } from 'vitest';

import {
  canAccessOwnedPreviewResource,
  getApplicantPreviewEditPermissions,
  getPositionPreviewEditPermissions,
} from './secure-file-preview-permission-utils';

describe('secure-file-preview-permission-utils', () => {
  it('derives applicant and position preview edit permissions', () => {
    expect(getApplicantPreviewEditPermissions({
      id: 'user-1',
      modulePermissions: ['applicantS_EDIT_BASIC_OWN'],
    })).toEqual({ global: false, own: true });

    expect(getPositionPreviewEditPermissions({
      id: 'user-1',
      modulePermissions: ['POSITIONS_EDIT_SENSITIVE'],
    })).toEqual({ global: true, own: false });
  });

  it('checks admin, global, and owned resource access', () => {
    expect(canAccessOwnedPreviewResource(
      { id: 'user-1', role: 'Admin' },
      'other-user',
      { global: false, own: false }
    )).toBe(true);

    expect(canAccessOwnedPreviewResource(
      { id: 'user-1' },
      'other-user',
      { global: true, own: false }
    )).toBe(true);

    expect(canAccessOwnedPreviewResource(
      { id: 'user-1' },
      'user-1',
      { global: false, own: true }
    )).toBe(true);

    expect(canAccessOwnedPreviewResource(
      { id: 'user-1' },
      'other-user',
      { global: false, own: true }
    )).toBe(false);
  });
});
