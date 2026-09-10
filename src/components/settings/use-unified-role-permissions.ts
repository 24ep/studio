"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import type { PlatformModuleId, UserGroup } from "@/lib/types";
import { getValidRolePermissions } from "./UnifiedRoleDrawerParts";
import { updateRolePermissions } from "./unified-role-drawer-api";
import { ROLE_ID_PATTERN } from "./unified-role-drawer-validation";

interface UseUnifiedRolePermissionsOptions {
  isOpen: boolean;
  role: UserGroup | null;
}

export function useUnifiedRolePermissions({
  isOpen,
  role,
}: UseUnifiedRolePermissionsOptions) {
  const [currentPermissions, setCurrentPermissions] = useState<PlatformModuleId[]>([]);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  const permissionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastPermissionUpdateRef = useRef("");
  const lastCommittedPermissionsRef = useRef<PlatformModuleId[]>([]);

  const clearPendingPermissionUpdate = useCallback(() => {
    if (permissionUpdateTimeoutRef.current) {
      clearTimeout(permissionUpdateTimeoutRef.current);
      permissionUpdateTimeoutRef.current = null;
    }
  }, []);

  const abortPendingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (role) {
      const validPermissions = getValidRolePermissions(role.permissions) as PlatformModuleId[];
      setCurrentPermissions(validPermissions);
      lastCommittedPermissionsRef.current = validPermissions;
    } else {
      setCurrentPermissions([]);
      lastCommittedPermissionsRef.current = [];
    }
  }, [role?.id, role?.isSystemRole, role?.permissions]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    clearPendingPermissionUpdate();
    abortPendingRequest();
    setIsUpdatingPermissions(false);
    lastPermissionUpdateRef.current = "";
  }, [abortPendingRequest, clearPendingPermissionUpdate, isOpen]);

  useEffect(() => () => {
    clearPendingPermissionUpdate();
    abortPendingRequest();
  }, [abortPendingRequest, clearPendingPermissionUpdate]);

  const handlePermissionUpdate = useCallback(async (permissions: PlatformModuleId[]) => {
    if (role?.isSystemRole) {
      return;
    }

    if (!role?.id) {
      console.error("handlePermissionUpdate: role.id is missing");
      return;
    }

    if (typeof role.id !== "string" || !ROLE_ID_PATTERN.test(role.id)) {
      console.error("handlePermissionUpdate: Invalid role ID format:", role.id);
      toast.error("Invalid role ID format. Please refresh the page.");
      return;
    }

    const permissionString = JSON.stringify([...permissions].sort());
    if (lastPermissionUpdateRef.current === permissionString) {
      return;
    }
    lastPermissionUpdateRef.current = permissionString;

    setCurrentPermissions(permissions);
    clearPendingPermissionUpdate();
    abortPendingRequest();

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsUpdatingPermissions(true);

    permissionUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await updateRolePermissions({
          roleId: role.id,
          permissions,
          signal,
        });

        setCurrentPermissions(result.permissions || []);
        lastCommittedPermissionsRef.current = Array.isArray(result.permissions) ? result.permissions : permissions;
        toast.success("Permissions updated successfully");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Error updating permissions:", error);
        toast.error((error as Error).message || "Failed to update permissions");
        setCurrentPermissions(lastCommittedPermissionsRef.current);
      } finally {
        setIsUpdatingPermissions(false);
      }
    }, 500);
  }, [abortPendingRequest, clearPendingPermissionUpdate, role?.id, role?.isSystemRole]);

  return {
    currentPermissions,
    handlePermissionUpdate,
    isUpdatingPermissions,
  };
}
