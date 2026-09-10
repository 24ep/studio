import type { UserProfile } from '@/lib/types';

export interface UsersPageFilters {
  name?: string | null;
  email?: string | null;
  role?: UserProfile['role'] | 'ALL_ROLES' | string | null;
  teamId?: string | 'ALL_TEAMS' | null;
}

export type UsersPageRoleFilter = UserProfile['role'] | 'ALL_ROLES';

export interface UsersPageFilterState {
  nameFilter: string;
  emailFilter: string;
  roleFilter: UsersPageRoleFilter;
  teamFilter: string | 'ALL_TEAMS';
}

export const USER_ROLE_FILTERS: readonly UsersPageRoleFilter[] = [
  'ALL_ROLES',
  'Admin',
  'Recruiter',
  'Hiring Manager',
  'Employee',
];

export interface UsersListResponse {
  users: UserProfile[];
  totalPages: number;
  totalCount: number;
}

export interface UsersPageSelectionState {
  selectedUserIds: Set<string>;
  selectionMode: 'none' | 'page' | 'allFiltered' | 'all';
}
