"use client";

import { UnifiedRoleDrawer } from '@/components/settings/UnifiedRoleDrawer';

import {
  DeleteRoleDialog,
  ResetPermissionsDialog,
  RoleFormDialog,
  UserGroupsErrorState,
  UserGroupsLoadingState,
  UserGroupsPageHeader,
  UserGroupsTable,
} from './UserGroupsPageParts';
import { RolePermissionsErrorBoundary } from './RolePermissionsErrorBoundary';
import { useUserGroupsPageController } from './use-user-groups-page-controller';

function RolesPermissionsPageContent() {
  const controller = useUserGroupsPageController();

  if (controller.isInitialLoading) {
    return <UserGroupsLoadingState />;
  }

  if (controller.showErrorState) {
    return (
      <UserGroupsErrorState
        fetchError={controller.fetchError || 'Unable to load user groups.'}
        onGoToDashboard={controller.goToDashboard}
      />
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <UserGroupsPageHeader
        showLogoOnly={controller.showLogoOnly}
        onCreateRole={() => controller.handleOpenModal()}
      />

      <UserGroupsTable
        roles={controller.roles}
        selectedRole={controller.selectedRole}
        isLoading={controller.isLoading}
        isResettingRoleId={controller.isResettingRoleId}
        onCreateRole={() => controller.handleOpenModal()}
        onSelectRole={controller.handleSelectRole}
        onConfirmDelete={controller.setRoleToDelete}
        onConfirmResetPermissions={controller.setRoleToReset}
      />

      <RoleFormDialog
        open={controller.isModalOpen}
        editingRole={controller.editingRole}
        form={controller.form}
        onOpenChange={controller.setIsModalOpen}
        onSubmit={controller.handleRoleFormSubmit}
      />

      <DeleteRoleDialog
        role={controller.roleToDelete}
        onCancel={() => controller.setRoleToDelete(null)}
        onConfirm={controller.handleDelete}
      />

      <ResetPermissionsDialog
        role={controller.roleToReset}
        isResetting={controller.isResettingRoleId === controller.roleToReset?.id}
        onCancel={() => controller.setRoleToReset(null)}
        onConfirm={controller.handleResetPermissions}
      />

      {controller.selectedRole && (
        <UnifiedRoleDrawer
          isOpen={controller.isUnifiedDrawerOpen}
          onOpenChange={controller.setIsUnifiedDrawerOpen}
          role={controller.selectedRole}
          onRoleChange={controller.refreshRolesInBackground}
          onMembersChange={controller.refreshRolesInBackground}
        />
      )}
    </div>
  );
}

export default function RolesPermissionsPage() {
  return (
    <RolePermissionsErrorBoundary>
      <RolesPermissionsPageContent />
    </RolePermissionsErrorBoundary>
  );
}
