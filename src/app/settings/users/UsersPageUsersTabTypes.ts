import type { ModalMode } from '@/components/users/UnifiedUserModal';
import type { UnifiedUserFormValues } from '@/components/users/UnifiedUserModal';
import type { UserProfile, UserTeam } from '@/lib/types';

export interface UsersPageUsersTabProps {
  users: UserProfile[];
  teams: UserTeam[];
  roles: Array<{ id: string; name: string }>;
  nameFilter: string;
  emailFilter: string;
  roleFilter: UserProfile['role'] | 'ALL_ROLES';
  teamFilter: string | 'ALL_TEAMS';
  selectedUserIds: Set<string>;
  isAllSelectedOnPage: boolean;
  isBulkUpdating: boolean;
  canEditUsers: boolean;
  onNameFilterChange: (value: string) => void;
  onEmailFilterChange: (value: string) => void;
  onRoleFilterChange: (value: UserProfile['role'] | 'ALL_ROLES') => void;
  onTeamFilterChange: (value: string | 'ALL_TEAMS') => void;
  onApplyFilters: () => void;
  onSelectAllOnPage: (checked: boolean) => void;
  onSelectUser: (userId: string, checked: boolean) => void;
  onBulkUpdateStatus: (isActive: boolean) => void;
  onClearSelection: () => void;
  onOpenUserModal: (mode: ModalMode, user?: UserProfile) => void;
  onEditUser: (userId: string, data: UnifiedUserFormValues) => Promise<void>;
  onToggleUserStatus: (user: UserProfile) => void;
  onConfirmDeleteUser: (user: UserProfile) => void;
}
