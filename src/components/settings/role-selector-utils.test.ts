import { describe, expect, it } from 'vitest';

import type { UserGroup } from '@/lib/types';
import {
  countSelectedRolesInGroup,
  filterRoleSelectorRoles,
  getRoleCategory,
  getRoleCategorySelectionLabel,
  getSelectedRoleBadges,
  groupRoleSelectorRoles,
} from './role-selector-utils';

const role = (overrides: Partial<UserGroup> & Pick<UserGroup, 'id' | 'name'>): UserGroup => ({
  id: overrides.id,
  name: overrides.name,
  description: overrides.description,
  permissions: [],
  user_count: overrides.user_count,
  isDefault: overrides.isDefault,
  isSystemRole: overrides.isSystemRole,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

describe('role selector utilities', () => {
  const roles = [
    role({ id: 'admin', name: 'Admin', isSystemRole: true }),
    role({ id: 'recruiter', name: 'Recruiter', isDefault: true, description: 'Hiring team' }),
    role({ id: 'custom', name: 'Custom Group' }),
  ];

  it('categorizes and groups roles in stable buckets', () => {
    expect(getRoleCategory(roles[0])).toBe('System Groups');
    expect(getRoleCategory(roles[1])).toBe('Default Groups');
    expect(getRoleCategory(roles[2])).toBe('Custom Groups');

    expect(groupRoleSelectorRoles(roles)).toMatchObject({
      'System Groups': [{ id: 'admin' }],
      'Default Groups': [{ id: 'recruiter' }],
      'Custom Groups': [{ id: 'custom' }],
    });
  });

  it('filters by role name and description', () => {
    expect(filterRoleSelectorRoles(roles, 'hiring')).toEqual([roles[1]]);
    expect(filterRoleSelectorRoles(roles, 'custom')).toEqual([roles[2]]);
    expect(filterRoleSelectorRoles(roles, '   ')).toEqual(roles);
  });

  it('summarizes selected roles per category', () => {
    expect(countSelectedRolesInGroup(['admin', 'missing'], roles)).toBe(1);
    expect(getRoleCategorySelectionLabel({
      multiple: true,
      roles,
      selectedRoleIds: ['admin', 'custom'],
    })).toBe('2/3');
    expect(getRoleCategorySelectionLabel({
      multiple: false,
      roles,
      selectedRoleIds: ['custom'],
    })).toBe('1 selected');
  });

  it('builds visible selected badges with overflow count', () => {
    expect(getSelectedRoleBadges({
      availableRoles: roles,
      maxVisible: 2,
      selectedRoleIds: ['admin', 'custom', 'missing'],
    })).toEqual({
      hiddenCount: 1,
      visibleRoles: [
        { id: 'admin', label: 'Admin' },
        { id: 'custom', label: 'Custom Group' },
      ],
    });
  });
});
