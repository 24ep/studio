import { describe, expect, it } from 'vitest';
import type { UserGroup } from '@/lib/types';
import {
  buildRoleFormDefaults,
  getRoleMemberCount,
  getRoleSaveRequest,
  getVisibleRoles,
  hasDuplicateRoleName,
  normalizeSelectableRole,
} from './user-groups-tab-utils';

const baseRole = {
  id: 'role-1',
  name: 'Recruiter',
  description: null,
  permissions: ['USER_GROUPS_VIEW'],
  isDefault: false,
  user_count: 3,
} as UserGroup;

describe('user-groups-tab-utils', () => {
  it('builds empty and edit form defaults', () => {
    expect(buildRoleFormDefaults()).toEqual({
      name: '',
      description: '',
      permissions: [],
      is_default: false,
    });

    expect(buildRoleFormDefaults(baseRole)).toEqual({
      name: 'Recruiter',
      description: '',
      permissions: ['USER_GROUPS_VIEW'],
      is_default: false,
    });
  });

  it('detects duplicate names only when creating roles', () => {
    expect(hasDuplicateRoleName([baseRole], 'recruiter', null)).toBe(true);
    expect(hasDuplicateRoleName([baseRole], 'Hiring Manager', null)).toBe(false);
    expect(hasDuplicateRoleName([baseRole], 'Recruiter', baseRole)).toBe(false);
  });

  it('builds create and update requests', () => {
    expect(getRoleSaveRequest()).toEqual({
      method: 'POST',
      url: '/api/settings/user-groups',
    });
    expect(getRoleSaveRequest(baseRole)).toEqual({
      method: 'PUT',
      url: '/api/settings/user-groups/role-1',
    });
  });

  it('filters invalid table rows and normalizes selectable role permissions', () => {
    const invalidRole = { id: '', name: '' } as UserGroup;

    expect(getVisibleRoles([baseRole, invalidRole])).toEqual([baseRole]);
    expect(normalizeSelectableRole({ ...baseRole, permissions: null as unknown as string[] })).toMatchObject({
      id: 'role-1',
      permissions: [],
    });
    expect(normalizeSelectableRole(invalidRole)).toBeNull();
  });

  it('uses memberCount override before user_count', () => {
    expect(getRoleMemberCount({ ...baseRole, memberCount: 8 } as UserGroup & { memberCount: number })).toBe(8);
    expect(getRoleMemberCount(baseRole)).toBe(3);
  });
});
