import type { UserGroup, UserProfile } from '@/lib/types';
import type { UnifiedUserFormValues } from './types';

export function getUnifiedUserRoleFromGroupName(groupName?: string | null) {
  const normalizedName = groupName?.toLowerCase() || '';

  if (normalizedName.includes('admin')) {
    return 'Admin';
  }

  if (normalizedName.includes('hiring') || normalizedName.includes('manager')) {
    return 'Hiring Manager';
  }

  if (normalizedName.includes('employee')) {
    return 'Employee';
  }

  return 'Recruiter';
}

export function getDefaultUnifiedUserGroup(groups: UserGroup[]) {
  return groups.find(group => group.isDefault) ||
    groups.find(group => group.name.toLowerCase().includes('recruiter')) ||
    groups[0] ||
    null;
}

export function buildUnifiedUserCreateDefaults(group?: UserGroup | null): Partial<UnifiedUserFormValues> {
  return {
    name: '',
    email: '',
    password: '',
    role: group ? getUnifiedUserRoleFromGroupName(group.name) : 'Recruiter',
    newPassword: '',
    forcePasswordChange: false,
    authenticationMethods: ['basic'],
    userTeamIds: [],
    userGroupIds: group ? [group.id] : [],
    avatarUrl: '',
    personalColor: '#3B82F6',
    positionTitle: '',
    department: '',
    phoneNumber: '',
    officeLocation: '',
  };
}

export function buildUnifiedUserEditDefaults(user: UserProfile): Partial<UnifiedUserFormValues> {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    newPassword: '',
    forcePasswordChange: false,
    authenticationMethods: user.authenticationMethods || ['basic'],
    userTeamIds: user.userTeamId ? [user.userTeamId] : [],
    userGroupIds: user.userGroupId ? [user.userGroupId] : [],
    avatarUrl: user.avatarUrl || '',
    personalColor: user.personalColor || '#3B82F6',
    positionTitle: user.positionTitle || '',
    department: user.department || '',
    phoneNumber: user.phoneNumber || '',
    officeLocation: user.officeLocation || '',
  };
}
