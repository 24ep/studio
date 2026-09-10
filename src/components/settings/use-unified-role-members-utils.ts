interface RoleMembersLoadOptions {
  activeTab: string;
  isOpen: boolean;
  roleId?: string | null;
}

interface AvailableUsersLoadOptions {
  isAddUserModalOpen: boolean;
  roleId?: string | null;
}

interface AddRoleUserOptions {
  roleId?: string | null;
  selectedUserId: string;
}

interface RoleUserAddPayload {
  roleId: string;
  selectedUserId: string;
}

export function shouldLoadUnifiedRoleMembers({ activeTab, isOpen, roleId }: RoleMembersLoadOptions) {
  return isOpen && Boolean(roleId) && activeTab === "members";
}

export function shouldLoadAvailableRoleUsers({ isAddUserModalOpen, roleId }: AvailableUsersLoadOptions) {
  return isAddUserModalOpen && Boolean(roleId);
}

export function canSubmitRoleUserAdd({ roleId, selectedUserId }: AddRoleUserOptions) {
  return Boolean(selectedUserId && roleId);
}

export function getRoleUserAddPayload(options: AddRoleUserOptions): RoleUserAddPayload | null {
  if (!options.roleId || !options.selectedUserId) {
    return null;
  }

  return { roleId: options.roleId, selectedUserId: options.selectedUserId };
}

export function isUnifiedRoleAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function getUnifiedRoleErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
