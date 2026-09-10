import { describe, expect, it } from 'vitest';

import {
  UNIFIED_USER_ACCOUNT_TAB_CONTENT_CLASS,
  UNIFIED_USER_TAB_CONTENT_CLASS,
  buildUnifiedUserCreateDefaults,
  buildUnifiedUserEditDefaults,
  buildUnifiedUserPermissionModel,
  buildUnifiedUserPreferencesEndpoint,
  buildUnifiedUserSavePayload,
  getDefaultUnifiedUserGroup,
  getUnifiedUserAzureAdSuccessMessage,
  getUnifiedUserRoleFromGroupName,
  mergeUnifiedUserPreferenceModel,
  mergeUnifiedUserAzureAdFields,
  shouldFetchUnifiedUserTeams,
  withAzureAdAuthenticationMethod,
} from './unified-user-modal-utils';
import type { UserGroup, UserProfile } from '@/lib/types';
import type { UnifiedUserFormValues } from './types';

describe('unified user modal utilities', () => {
  it('infers role labels from user group names', () => {
    expect(getUnifiedUserRoleFromGroupName('System Admins')).toBe('Admin');
    expect(getUnifiedUserRoleFromGroupName('Hiring Managers')).toBe('Hiring Manager');
    expect(getUnifiedUserRoleFromGroupName('Recruiter Team')).toBe('Recruiter');
    expect(getUnifiedUserRoleFromGroupName('Other')).toBe('Recruiter');
    expect(getUnifiedUserRoleFromGroupName(null)).toBe('Recruiter');
  });

  it('selects default groups and builds create defaults', () => {
    const groups = [
      { id: 'group-1', name: 'Other' },
      { id: 'group-2', name: 'Recruiters' },
      { id: 'group-3', name: 'Admins', isDefault: true },
    ] as UserGroup[];

    const defaultGroup = getDefaultUnifiedUserGroup(groups);
    expect(defaultGroup?.id).toBe('group-3');
    expect(getDefaultUnifiedUserGroup(groups.slice(0, 2))?.id).toBe('group-2');
    expect(getDefaultUnifiedUserGroup([])).toBeNull();
    expect(buildUnifiedUserCreateDefaults(defaultGroup)).toMatchObject({
      role: 'Admin',
      userGroupIds: ['group-3'],
      authenticationMethods: ['basic'],
    });
  });

  it('builds edit defaults from an existing user', () => {
    expect(buildUnifiedUserEditDefaults({
      name: 'Ada',
      email: 'ada@example.com',
      role: 'Admin',
      userTeamId: 'team-1',
      userGroupId: 'group-1',
      authenticationMethods: ['basic', 'azure_ad'],
      avatarUrl: 'avatar.png',
      personalColor: '#111111',
      positionTitle: 'Lead',
    } as UserProfile)).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      role: 'Admin',
      userTeamIds: ['team-1'],
      userGroupIds: ['group-1'],
      authenticationMethods: ['basic', 'azure_ad'],
      positionTitle: 'Lead',
    });
  });

  it('builds permission models and team fetch decisions', () => {
    expect(buildUnifiedUserPermissionModel({
      hasUserManagePermission: true,
      mode: 'edit',
      sessionUserId: 'admin-1',
      userId: 'user-1',
    })).toEqual({
      canManageAuthentication: true,
      canManageTeams: true,
      canManageUsers: true,
      canForcePasswordChange: true,
      isEditingSelf: false,
    });
    expect(buildUnifiedUserPermissionModel({
      hasUserManagePermission: true,
      mode: 'edit',
      sessionUserId: 'user-1',
      userId: 'user-1',
    }).canForcePasswordChange).toBe(false);
    expect(buildUnifiedUserPermissionModel({
      hasUserManagePermission: false,
      mode: 'profile',
      sessionUserId: 'user-1',
      userId: 'user-1',
    })).toMatchObject({
      canManageUsers: false,
      canForcePasswordChange: false,
      isEditingSelf: true,
    });

    expect(shouldFetchUnifiedUserTeams({ canManageTeams: true, mode: 'edit' })).toBe(true);
    expect(shouldFetchUnifiedUserTeams({ canManageTeams: false, mode: 'profile' })).toBe(true);
    expect(shouldFetchUnifiedUserTeams({ canManageTeams: false, mode: 'create' })).toBe(false);
  });

  it('builds preference endpoints for self/profile and admin edits', () => {
    expect(buildUnifiedUserPreferencesEndpoint({
      mode: 'profile',
      targetUserId: 'user-2',
      sessionUserId: 'user-1',
    })).toBe('/api/user-preferences');
    expect(buildUnifiedUserPreferencesEndpoint({
      mode: 'edit',
      targetUserId: 'user-1',
      sessionUserId: 'user-1',
      modelType: 'sidebar',
    })).toBe('/api/user-preferences?modelType=sidebar');
    expect(buildUnifiedUserPreferencesEndpoint({
      mode: 'edit',
      targetUserId: 'user-2',
      sessionUserId: 'user-1',
    })).toBe('/api/user-preferences/user-2');
  });

  it('merges preferences and builds save payloads', () => {
    expect(mergeUnifiedUserPreferenceModel(null, 'sidebar', { showAssignedPositions: true })).toBeNull();
    expect(mergeUnifiedUserPreferenceModel({
      sidebar: { compact: true },
      table: { pageSize: 25 },
    }, 'sidebar', { showAssignedPositions: true })).toEqual({
      sidebar: { compact: true, showAssignedPositions: true },
      table: { pageSize: 25 },
    });

    const formData: UnifiedUserFormValues = {
      name: '',
      email: 'user@example.com',
      password: '',
      role: 'Recruiter',
      newPassword: '',
      forcePasswordChange: false,
      authenticationMethods: ['basic'],
      userTeamIds: [],
      userGroupIds: [],
      avatarUrl: '',
      personalColor: '#3B82F6',
      positionTitle: '',
    };
    expect(buildUnifiedUserSavePayload(formData, { DEPARTMENT: 'R&D' })).toMatchObject({
      customFields: { DEPARTMENT: 'R&D' },
      authenticationMethods: ['basic'],
    });
  });

  it('derives Azure AD auth method state and user feedback text', () => {
    expect(withAzureAdAuthenticationMethod(['basic'])).toEqual(['basic', 'azure_ad']);
    expect(withAzureAdAuthenticationMethod(['basic', 'azure_ad'])).toEqual(['basic', 'azure_ad']);
    expect(withAzureAdAuthenticationMethod()).toEqual(['azure_ad']);
    expect(getUnifiedUserAzureAdSuccessMessage({ jobTitle: 'Engineer' })).toBe(
      'User data loaded from Azure AD - Engineer'
    );
    expect(getUnifiedUserAzureAdSuccessMessage({})).toBe('User data loaded from Azure AD');
    expect(UNIFIED_USER_TAB_CONTENT_CLASS).toContain('space-y-6');
    expect(UNIFIED_USER_ACCOUNT_TAB_CONTENT_CLASS).toContain('space-y-4');
  });

  it('merges Azure AD profile data into form and custom fields', () => {
    expect(mergeUnifiedUserAzureAdFields({
      currentCustomFields: { EXISTING: 'keep' },
      adUser: {
        displayName: 'Ada Lovelace',
        jobTitle: 'Principal Engineer',
        department: 'R&D',
        officeLocation: 'London',
        mobilePhone: '+123',
      },
    })).toEqual({
      formUpdates: {
        name: 'Ada Lovelace',
        positionTitle: 'Principal Engineer',
      },
      customFields: {
        EXISTING: 'keep',
        POSITION: 'Principal Engineer',
        JOB_TITLE: 'Principal Engineer',
        DEPARTMENT: 'R&D',
        OFFICE_LOCATION: 'London',
        MOBILE_PHONE: '+123',
      },
    });
  });
});
