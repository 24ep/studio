import React from 'react';

import { AuthenticationCard, RoleAndGroupsCard } from './UserManagementFormParts';
import type { UserManagementFormProps } from './user-management-form-types';

export function UserManagementForm({
  form,
  userGroups,
  isLoadingGroups,
  canManageUsers,
  isEditingSelf,
  canManageTeams,
  userTeams,
  canManageAuthentication,
  isLookingUpAD,
  handleLookupAzureAD
}: UserManagementFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RoleAndGroupsCard
        form={form}
        userGroups={userGroups}
        isLoadingGroups={isLoadingGroups}
        canManageUsers={canManageUsers}
        isEditingSelf={isEditingSelf}
        canManageTeams={canManageTeams}
        userTeams={userTeams}
      />
      <AuthenticationCard
        form={form}
        canManageAuthentication={canManageAuthentication}
        isLookingUpAD={isLookingUpAD}
        handleLookupAzureAD={handleLookupAzureAD}
      />
    </div>
  );
}
