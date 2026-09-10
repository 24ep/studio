"use client";

import React from "react";

import {
  PLATFORM_MODULE_CATEGORIES,
  PLATFORM_MODULES,
  type PlatformModuleId,
} from "@/lib/types";
import type {
  RolePermissionSelectorActions,
  RolePermissionSelectorProps,
} from "./RolePermissionSelectorTypes";
import {
  buildPermissionGroupsFromModules,
  clearCategoryPermissionIds,
  clearPermissionsWithProtection,
  filterPermissionGroups,
  getCategoryPermissionIds,
  getValidPermissionModules,
  normalizePermissionIds,
  selectCategoryPermissionIds,
  togglePermissionId,
} from "./role-permission-selector-utils";

function buildPermissionGroups() {
  return buildPermissionGroupsFromModules(
    PLATFORM_MODULE_CATEGORIES,
    PLATFORM_MODULES,
  );
}

export function useRolePermissionSelector({
  disabled = false,
  onPermissionsChange,
  protectedPermissions = [],
  selectedPermissions = [],
}: Pick<
  RolePermissionSelectorProps,
  | "disabled"
  | "onPermissionsChange"
  | "protectedPermissions"
  | "selectedPermissions"
>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollPositionRef = React.useRef<number>(0);

  const groupedPermissions = React.useMemo(buildPermissionGroups, []);
  const safeSelectedPermissions = React.useMemo(
    () => normalizePermissionIds(selectedPermissions, "selectedPermissions"),
    [selectedPermissions],
  );
  const safeProtectedPermissions = React.useMemo(
    () => normalizePermissionIds(protectedPermissions, "protectedPermissions"),
    [protectedPermissions],
  );

  const filteredGroupedPermissions = React.useMemo(() => {
    return filterPermissionGroups(groupedPermissions, searchQuery);
  }, [groupedPermissions, searchQuery]);

  const preserveScrollPosition = React.useCallback(() => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  }, []);

  const restoreScrollPosition = React.useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, []);

  const updatePermissions = React.useCallback(
    (permissions: PlatformModuleId[]) => {
      onPermissionsChange(permissions);
      setTimeout(restoreScrollPosition, 0);
    },
    [onPermissionsChange, restoreScrollPosition],
  );

  const selectCategoryPermissions = React.useCallback(
    (category: string) => {
      if (disabled) return;

      updatePermissions(selectCategoryPermissionIds(
        safeSelectedPermissions,
        getCategoryPermissionIds(PLATFORM_MODULES, category),
      ));
    },
    [disabled, safeSelectedPermissions, updatePermissions],
  );

  const clearCategoryPermissions = React.useCallback(
    (category: string) => {
      if (disabled) return;

      updatePermissions(clearCategoryPermissionIds(
        safeSelectedPermissions,
        safeProtectedPermissions,
        getCategoryPermissionIds(PLATFORM_MODULES, category),
      ));
    },
    [
      disabled,
      safeProtectedPermissions,
      safeSelectedPermissions,
      updatePermissions,
    ],
  );

  const togglePermission = React.useCallback(
    (permissionId: PlatformModuleId) => {
      if (disabled) return;

      preserveScrollPosition();
      if (
        safeSelectedPermissions.includes(permissionId) &&
        safeProtectedPermissions.includes(permissionId)
      ) {
        return;
      }

      updatePermissions(togglePermissionId(
        safeSelectedPermissions,
        safeProtectedPermissions,
        permissionId,
      ));
    },
    [
      disabled,
      preserveScrollPosition,
      safeProtectedPermissions,
      safeSelectedPermissions,
      updatePermissions,
    ],
  );

  const selectAllPermissions = React.useCallback(() => {
    if (disabled) return;

    preserveScrollPosition();
    const selectablePermissions = getValidPermissionModules(PLATFORM_MODULES)
      .map((module) => module.id as PlatformModuleId)
      .filter(Boolean);
    updatePermissions(selectablePermissions);
  }, [disabled, preserveScrollPosition, updatePermissions]);

  const clearAllPermissions = React.useCallback(() => {
    if (disabled) return;

    preserveScrollPosition();
    updatePermissions(clearPermissionsWithProtection(
      safeSelectedPermissions,
      safeProtectedPermissions,
    ));
  }, [
    disabled,
    preserveScrollPosition,
    safeProtectedPermissions,
    safeSelectedPermissions,
    updatePermissions,
  ]);

  const actions: RolePermissionSelectorActions = {
    clearAllPermissions,
    clearCategoryPermissions,
    selectAllPermissions,
    selectCategoryPermissions,
    setSearchQuery,
    togglePermission,
  };

  return {
    actions,
    filteredGroupedPermissions,
    hasPermissionData: Array.isArray(PLATFORM_MODULES) && PLATFORM_MODULES.length > 0,
    safeProtectedPermissions,
    safeSelectedPermissions,
    scrollContainerRef,
    searchQuery,
  };
}
