"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { UserGroup } from "@/lib/types";

import { RolePermissionSelector } from "./RolePermissionSelector";
import { UnifiedRoleMembersTab } from "./UnifiedRoleMembersTab";
import {
  AddRoleUserDialog,
  RoleDetailsTab,
  UnifiedRoleDrawerErrorBoundary,
  UnifiedRoleDrawerTabs,
} from "./UnifiedRoleDrawerParts";
import { useUnifiedRoleDrawer } from "./use-unified-role-drawer";

interface UnifiedRoleDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserGroup | null;
  onRoleChange?: () => void;
  onMembersChange?: () => void;
}

const MEMBERS_PER_PAGE = 10;

export function UnifiedRoleDrawer({
  isOpen,
  onOpenChange,
  role,
  onRoleChange,
  onMembersChange,
}: UnifiedRoleDrawerProps) {
  const drawer = useUnifiedRoleDrawer({
    isOpen,
    role,
    onRoleChange,
    onMembersChange,
  });

  if (!drawer.isRoleValid || !drawer.isMounted || !role) {
    return null;
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full max-w-[85vw] sm:max-w-[80vw] md:max-w-[75vw] lg:max-w-[70vw] xl:max-w-[900px] flex flex-col p-0" sheetId="unified-role-drawer">
          <UnifiedRoleDrawerErrorBoundary>
            <div className="flex-1 flex flex-col min-h-0">
              <UnifiedRoleDrawerTabs
                activeTab={drawer.activeTab}
                membersCount={drawer.members.length}
                onTabChange={drawer.setActiveTab}
              />

              <div className="flex-1 flex flex-col min-h-0">
                {drawer.activeTab === "details" && (
                  <RoleDetailsTab
                    form={drawer.form}
                    isSavingRole={drawer.isSavingRole}
                    isSystemRole={drawer.isSystemRole}
                    onSubmit={drawer.handleRoleFormSubmit}
                  />
                )}

                {drawer.activeTab === "permissions" && (
                  <div
                    className="flex-1 min-h-0 flex flex-col"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }}
                  >
                    <RolePermissionSelector
                      key={role.id}
                      selectedPermissions={Array.isArray(drawer.currentPermissions) ? drawer.currentPermissions : []}
                      onPermissionsChange={drawer.handlePermissionUpdate}
                      disabled={drawer.isSystemRole}
                      isLoading={drawer.isUpdatingPermissions}
                      title={`${role.name || "Unknown"} Permissions`}
                      description={
                        drawer.isSystemRole
                          ? "System role permissions cannot be modified."
                          : drawer.isUpdatingPermissions
                            ? "Updating permissions..."
                            : "Configure what users with this role can do."
                      }
                      className="h-full"
                      noCard
                    />
                  </div>
                )}

                {drawer.activeTab === "members" && (
                  <UnifiedRoleMembersTab
                    roleName={role.name || "Unknown"}
                    members={drawer.members}
                    isLoadingMembers={drawer.isLoadingMembers}
                    memberSearchTerm={drawer.memberSearchTerm}
                    memberPage={drawer.memberPage}
                    membersPerPage={MEMBERS_PER_PAGE}
                    isRemovingUser={drawer.isRemovingUser}
                    onAddUserClick={() => drawer.setIsAddUserModalOpen(true)}
                    onSearchChange={drawer.handleMemberSearchChange}
                    onPageChange={drawer.setMemberPage}
                    onRemoveUser={drawer.handleRemoveUser}
                  />
                )}
              </div>
            </div>
          </UnifiedRoleDrawerErrorBoundary>
        </SheetContent>
      </Sheet>

      <AddRoleUserDialog
        open={drawer.isAddUserModalOpen}
        roleName={role.name || "Unknown"}
        selectedUserId={drawer.selectedUserId}
        searchTerm={drawer.searchTerm}
        availableUsers={drawer.availableUsers}
        members={drawer.members}
        isLoadingAvailable={drawer.isLoadingAvailable}
        isAddingUser={drawer.isAddingUser}
        onOpenChange={drawer.setIsAddUserModalOpen}
        onSelectedUserChange={drawer.setSelectedUserId}
        onSearchChange={drawer.setSearchTerm}
        onCancel={drawer.handleCancelAddUser}
        onAddUser={drawer.handleAddUser}
      />
    </>
  );
}
