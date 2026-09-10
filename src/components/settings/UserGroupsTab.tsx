"use client";

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

import { UnifiedRoleDrawer } from '@/components/settings/UnifiedRoleDrawer';
import {
  DefaultGroupsAlert,
  DeleteRoleDialog,
  RoleFormDialog,
  RolesTable,
  UserGroupsErrorState,
  UserGroupsHeader,
  UserGroupsLoadingState,
} from './UserGroupsTabParts';
import { useUserGroupsTabController } from './use-user-groups-tab-controller';

export function UserGroupsTab() {
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const controller = useUserGroupsTabController({
    pathname,
    session,
    sessionStatus,
  });

  if (controller.isLoading) {
    return <UserGroupsLoadingState />;
  }

  if (controller.fetchError && !controller.isLoading) {
    return <UserGroupsErrorState fetchError={controller.fetchError} />;
  }

  return (
    <div className="space-y-6">
      <UserGroupsHeader
        canManageRoles={controller.canManageRoles}
        onCreateRole={() => controller.handleOpenModal()}
      />
      <DefaultGroupsAlert />
      <RolesTable
        canManageRoles={controller.canManageRoles}
        roles={controller.roles}
        onConfirmDelete={controller.setRoleToDelete}
        onCreateRole={() => controller.handleOpenModal()}
        onSelectRole={controller.handleSelectRole}
      />

      {controller.selectedRole && (
        <UnifiedRoleDrawer
          isOpen={controller.isUnifiedDrawerOpen}
          onOpenChange={controller.setIsUnifiedDrawerOpen}
          role={controller.selectedRole}
          onRoleChange={controller.fetchRoles}
          onMembersChange={controller.fetchRoles}
        />
      )}

      <RoleFormDialog
        editingRole={controller.editingRole}
        form={controller.form}
        open={controller.isModalOpen}
        onOpenChange={controller.setIsModalOpen}
        onSubmit={controller.handleRoleFormSubmit}
      />

      <DeleteRoleDialog
        role={controller.roleToDelete}
        onCancel={() => controller.setRoleToDelete(null)}
        onConfirm={controller.handleDeleteRole}
      />
    </div>
  );
}
