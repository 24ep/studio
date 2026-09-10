import { describe, expect, it } from 'vitest';
import type { PlatformModule } from '@/lib/types';
import {
  buildPermissionGroups,
  buildPermissionFamilyGroups,
  filterRoles,
  getPermissionRiskSummary,
  havePermissionsChanged,
  setPermissionFamilyLevel,
  togglePermission,
} from './roles-permissions-workspace-model';

const modules: PlatformModule[] = [
  { id: 'PEOPLE_VIEW', label: 'View people', category: 'HR Operations', description: 'Read people', detailedDescription: '', impact: '', riskLevel: 'LOW' },
  { id: 'PEOPLE_MANAGE', label: 'Manage people', category: 'HR Operations', description: 'Edit people', detailedDescription: '', impact: '', riskLevel: 'HIGH', requiresApproval: true },
  { id: 'USERS_VIEW', label: 'View users', category: 'User Access Control', description: 'Read accounts', detailedDescription: '', impact: '', riskLevel: 'MEDIUM' },
];

describe('roles permissions workspace model', () => {
  it('groups, searches, and counts selected permissions', () => {
    expect(buildPermissionGroups(modules, ['PEOPLE_VIEW'], 'people')).toEqual([{
      category: 'HR Operations',
      permissions: modules.slice(0, 2),
      enabledCount: 1,
    }]);
  });

  it('filters roles across name and description', () => {
    expect(filterRoles([
      { id: '1', name: 'HR Manager', description: 'People operations' },
      { id: '2', name: 'Recruiter' },
    ], 'people')).toHaveLength(1);
  });

  it('toggles permissions without mutating the source', () => {
    const selected = ['PEOPLE_VIEW'];
    expect(togglePermission(selected, 'USERS_VIEW')).toEqual(['PEOPLE_VIEW', 'USERS_VIEW']);
    expect(togglePermission(selected, 'PEOPLE_VIEW')).toEqual([]);
    expect(selected).toEqual(['PEOPLE_VIEW']);
  });

  it('summarizes risk and detects unordered changes', () => {
    expect(getPermissionRiskSummary(modules, ['PEOPLE_MANAGE'])).toMatchObject({ total: 1, highRisk: 1, approvalRequired: 1 });
    expect(havePermissionsChanged(['USERS_VIEW', 'PEOPLE_VIEW'], ['PEOPLE_VIEW', 'USERS_VIEW'])).toBe(false);
    expect(havePermissionsChanged(['PEOPLE_VIEW'], ['USERS_VIEW'])).toBe(true);
  });

  it('builds safe access-level families from real permission ids', () => {
    const groups = buildPermissionFamilyGroups(modules, ['PEOPLE_MANAGE']);
    const family = groups[0].families[0];
    expect(family.selectedLevel).toBe('manage');
    expect(family.modules.view?.id).toBe('PEOPLE_VIEW');
    expect(setPermissionFamilyLevel([], family, 'manage')).toEqual(['PEOPLE_VIEW', 'PEOPLE_MANAGE']);
    expect(setPermissionFamilyLevel(['PEOPLE_VIEW', 'PEOPLE_MANAGE'], family, 'none')).toEqual([]);
  });
});
