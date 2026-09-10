import { describe, expect, it } from 'vitest';

import {
  buildRoleFormDefaults,
  canViewUserGroups,
  getRoleSaveRequest,
  normalizeUserGroupsListResponse,
  parseShowLogoOnlySetting,
  syncSelectedRoleAfterRoleListUpdate,
  validateSelectableRole,
} from './user-groups-page-utils';
import type { UserGroup } from '@/lib/types';

const VALID_ROLE_ID = '3ef92d46-ec74-4f35-95a2-b8b63e0c7df8';

describe('user-groups page utilities', () => {
  it('builds role form defaults for create and edit modes', () => {
    expect(buildRoleFormDefaults()).toEqual({
      name: '',
      description: '',
      permissions: [],
      is_default: false,
    });

    expect(buildRoleFormDefaults({
      name: 'Recruiter',
      description: null,
      permissions: ['USERS_VIEW'],
      isDefault: true,
    } as UserGroup)).toEqual({
      name: 'Recruiter',
      description: '',
      permissions: ['USERS_VIEW'],
      is_default: true,
    });
  });

  it('builds role save request metadata', () => {
    expect(getRoleSaveRequest(null)).toEqual({
      isEditing: false,
      url: '/api/settings/user-groups',
      method: 'POST',
    });

    expect(getRoleSaveRequest({ id: VALID_ROLE_ID } as UserGroup)).toEqual({
      isEditing: true,
      url: `/api/settings/user-groups/${VALID_ROLE_ID}`,
      method: 'PUT',
    });
  });

  it('detects users allowed to view user groups', () => {
    expect(canViewUserGroups({ role: 'Admin', modulePermissions: [] })).toBe(true);
    expect(canViewUserGroups({ role: 'Recruiter', modulePermissions: ['USER_GROUPS_VIEW'] })).toBe(true);
    expect(canViewUserGroups({ role: 'Recruiter', modulePermissions: [] })).toBe(false);
    expect(canViewUserGroups(null)).toBe(false);
  });

  it('validates selectable role ids before opening the drawer', () => {
    expect(validateSelectableRole({ id: VALID_ROLE_ID } as UserGroup)).toEqual({ valid: true });
    expect(validateSelectableRole({ id: '' } as UserGroup)).toMatchObject({
      valid: false,
      userMessage: 'Invalid role data. Please refresh the page.',
    });
    expect(validateSelectableRole({ id: 'not-a-uuid' } as UserGroup)).toMatchObject({
      valid: false,
      userMessage: 'Invalid role ID format. Please refresh the page.',
    });
  });

  it('syncs the selected role with refreshed role list data', () => {
    const previous = { id: VALID_ROLE_ID, name: 'Old name' } as UserGroup;
    const updated = { id: VALID_ROLE_ID, name: 'Updated name' } as UserGroup;

    expect(syncSelectedRoleAfterRoleListUpdate([updated], previous)).toBe(updated);
    expect(syncSelectedRoleAfterRoleListUpdate([], previous)).toBe(previous);
    expect(syncSelectedRoleAfterRoleListUpdate([updated], null)).toBeNull();
  });

  it('normalizes roles list responses and showLogoOnly settings defensively', () => {
    const roles = [{ id: VALID_ROLE_ID, name: 'Recruiter' }] as UserGroup[];

    expect(normalizeUserGroupsListResponse(roles)).toEqual(roles);
    expect(normalizeUserGroupsListResponse({ roles })).toEqual([]);
    expect(normalizeUserGroupsListResponse([{ id: '', name: 'No id' }, null])).toEqual([]);

    expect(parseShowLogoOnlySetting({ showLogoOnly: true })).toBe(true);
    expect(parseShowLogoOnlySetting({ showLogoOnly: 'true' })).toBe(true);
    expect(parseShowLogoOnlySetting({ showLogoOnly: 'false' })).toBe(false);
    expect(parseShowLogoOnlySetting(null)).toBe(false);
  });
});
