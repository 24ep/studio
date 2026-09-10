import { describe, expect, it } from 'vitest';
import { isPrivacySupportAdmin } from './privacy-support';

describe('privacy support authorization', () => {
  it('allows administrators and users who can manage HR people data', () => {
    expect(isPrivacySupportAdmin({ id: 'admin', role: 'Admin' })).toBe(true);
    expect(isPrivacySupportAdmin({
      id: 'hr',
      role: 'Recruiter',
      modulePermissions: ['HR_PEOPLE_MANAGE'],
    })).toBe(true);
  });

  it('does not grant HR access from view-only or unrelated permissions', () => {
    expect(isPrivacySupportAdmin({
      id: 'viewer',
      role: 'Recruiter',
      modulePermissions: ['HR_PEOPLE_VIEW'],
    })).toBe(false);
    expect(isPrivacySupportAdmin({ id: 'employee', role: 'Viewer' })).toBe(false);
  });
});
