import { describe, expect, it } from 'vitest';

import { resolveHriveOrganization } from './context';

const organizations = [
  { id: 'org-a', role: 'owner', name: 'A', slug: 'a' },
  { id: 'org-b', role: 'member', name: 'B', slug: 'b' },
];

describe('Outborn Core Hrive organization resolution', () => {
  it('uses the only Account organization automatically', () => {
    expect(resolveHriveOrganization([organizations[0]!])).toEqual(organizations[0]);
  });

  it('uses a configured organization only when the Account user belongs to it', () => {
    expect(resolveHriveOrganization(organizations, 'org-b')).toEqual(organizations[1]);
    expect(() => resolveHriveOrganization(organizations, 'org-missing')).toThrow(/not a member/i);
  });

  it('rejects ambiguous multi-organization sessions instead of selecting an arbitrary tenant', () => {
    expect(() => resolveHriveOrganization(organizations)).toThrow(/OUTBORN_HRIVE_ORGANIZATION_ID/);
  });
});
