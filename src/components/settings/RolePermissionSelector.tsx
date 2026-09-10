"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PermissionGroupList,
  PermissionSearchInput,
  PermissionSelectorHeader,
  PermissionSelectorToolbar,
  PermissionSelectorUnavailableState,
} from "./RolePermissionSelectorParts";
import type { RolePermissionSelectorProps } from "./RolePermissionSelectorTypes";
import { useRolePermissionSelector } from "./use-role-permission-selector";

export function RolePermissionSelector({
  selectedPermissions = [],
  onPermissionsChange,
  title = "Permission Selection",
  description = "Choose which permissions should be granted to this role.",
  disabled = false,
  className,
  noCard = false,
  protectedPermissions = [],
  isLoading = false,
}: RolePermissionSelectorProps) {
  const permissions = useRolePermissionSelector({
    disabled,
    onPermissionsChange,
    protectedPermissions,
    selectedPermissions,
  });

  if (!permissions.hasPermissionData) {
    return <PermissionSelectorUnavailableState />;
  }

  const content = (
    <>
      {!noCard && (
        <PermissionSelectorHeader
          description={description}
          title={title}
        />
      )}
      <div className={cn("p-0 flex-1 overflow-hidden flex flex-col min-h-0", noCard ? "pt-0" : "")}>
        <PermissionSelectorToolbar
          actions={permissions.actions}
          disabled={disabled}
          isLoading={isLoading}
          selectedCount={permissions.safeSelectedPermissions.length}
        />
        <PermissionSearchInput
          disabled={disabled}
          searchQuery={permissions.searchQuery}
          setSearchQuery={permissions.actions.setSearchQuery}
        />
        <PermissionGroupList
          actions={permissions.actions}
          disabled={disabled}
          groups={permissions.filteredGroupedPermissions}
          protectedPermissions={permissions.safeProtectedPermissions}
          scrollContainerRef={permissions.scrollContainerRef}
          selectedPermissions={permissions.safeSelectedPermissions}
        />
      </div>
    </>
  );

  if (noCard) {
    return <div className={cn("flex flex-col h-full", className)}>{content}</div>;
  }

  return (
    <Card className={cn("border border-border shadow-sm flex flex-col h-full", className)}>
      {content}
    </Card>
  );
}
