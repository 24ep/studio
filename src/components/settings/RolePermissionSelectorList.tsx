"use client";

import type { RefObject } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { PlatformModule, PlatformModuleId } from "@/lib/types";

import {
  ApprovalRequiredBadge,
  ProtectedPermissionBadge,
  RiskLevelBadge,
} from "./RolePermissionSelectorBadges";
import type {
  PermissionGroup,
  RolePermissionSelectorActions,
} from "./RolePermissionSelectorTypes";

interface PermissionGroupListProps {
  actions: RolePermissionSelectorActions;
  disabled: boolean;
  groups: PermissionGroup[];
  protectedPermissions: PlatformModuleId[];
  scrollContainerRef: RefObject<HTMLDivElement>;
  selectedPermissions: PlatformModuleId[];
}

export function PermissionGroupList({
  actions,
  disabled,
  groups,
  protectedPermissions,
  scrollContainerRef,
  selectedPermissions,
}: PermissionGroupListProps) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0" ref={scrollContainerRef}>
      {groups.map(({ category, permissions }) => (
        <PermissionCategoryGroup
          key={`category-${category}`}
          actions={actions}
          category={category}
          disabled={disabled}
          permissions={permissions}
          protectedPermissions={protectedPermissions}
          selectedPermissions={selectedPermissions}
        />
      ))}
    </div>
  );
}

interface PermissionCategoryGroupProps {
  actions: RolePermissionSelectorActions;
  category: string;
  disabled: boolean;
  permissions: PlatformModule[];
  protectedPermissions: PlatformModuleId[];
  selectedPermissions: PlatformModuleId[];
}

function PermissionCategoryGroup({
  actions,
  category,
  disabled,
  permissions,
  protectedPermissions,
  selectedPermissions,
}: PermissionCategoryGroupProps) {
  const selectedCount = selectedPermissions.filter((permissionId) =>
    permissions.some((permission) => permission.id === permissionId),
  ).length;

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="sticky top-0 bg-background border-b border-border/50 px-4 py-2 z-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold text-foreground capitalize">
              {category.toLowerCase()}
            </h4>
            <Badge variant="outline" className="text-xs">
              {permissions.length}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">
              {selectedCount}/{permissions.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => actions.selectCategoryPermissions(category)}
              disabled={disabled}
              className="h-5 px-1 text-xs"
            >
              All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => actions.clearCategoryPermissions(category)}
              disabled={disabled}
              className="h-5 px-1 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {permissions.map((permission) => (
          <PermissionOption
            key={`permission-${permission.id}-${category}`}
            actions={actions}
            disabled={disabled}
            permission={permission}
            protectedPermissions={protectedPermissions}
            selectedPermissions={selectedPermissions}
          />
        ))}
      </div>
    </div>
  );
}

interface PermissionOptionProps {
  actions: RolePermissionSelectorActions;
  disabled: boolean;
  permission: PlatformModule;
  protectedPermissions: PlatformModuleId[];
  selectedPermissions: PlatformModuleId[];
}

function PermissionOption({
  actions,
  disabled,
  permission,
  protectedPermissions,
  selectedPermissions,
}: PermissionOptionProps) {
  const permissionId = permission.id as PlatformModuleId;
  const isProtected = protectedPermissions.includes(permissionId);
  const isSelected = selectedPermissions.includes(permissionId);
  const isDisabled = disabled || (isProtected && isSelected);

  return (
    <div className="group">
      <label
        className={cn(
          "flex items-center space-x-3 p-3 hover:bg-muted/30 transition-colors cursor-pointer",
          isDisabled && "cursor-not-allowed opacity-50",
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => actions.togglePermission(permissionId)}
          disabled={isDisabled}
          className="rounded border-2 border-primary/30 focus:ring-2 focus:ring-primary text-primary"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {permission.label || permission.id}
              </span>
              {isProtected && <ProtectedPermissionBadge />}
              {permission.riskLevel && (
                <RiskLevelBadge riskLevel={permission.riskLevel} />
              )}
              {permission.requiresApproval && <ApprovalRequiredBadge />}
            </div>
            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
              {permission.id}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {permission.description || "No description available"}
          </p>
          {isProtected && isSelected && (
            <span className="block text-amber-600 dark:text-amber-400 mt-1 text-xs">
              This permission cannot be removed for security reasons.
            </span>
          )}
        </div>
      </label>
    </div>
  );
}
