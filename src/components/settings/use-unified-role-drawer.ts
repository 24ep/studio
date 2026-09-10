"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

import type { UserGroup } from "@/lib/types";

import {
  EMPTY_ROLE_FORM_VALUES,
  roleFormResolver,
  type RoleFormValues,
} from "./UnifiedRoleDrawerParts";
import { validateRoleForDrawer } from "./unified-role-drawer-validation";
import { updateRoleDetails } from "./unified-role-drawer-api";
import { useUnifiedRoleMembers } from "./use-unified-role-members";
import { useUnifiedRolePermissions } from "./use-unified-role-permissions";

interface UseUnifiedRoleDrawerOptions {
  isOpen: boolean;
  role: UserGroup | null;
  onRoleChange?: () => void;
  onMembersChange?: () => void;
}

export function useUnifiedRoleDrawer({
  isOpen,
  role,
  onRoleChange,
  onMembersChange,
}: UseUnifiedRoleDrawerOptions) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isSavingRole, setIsSavingRole] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: roleFormResolver,
    defaultValues: EMPTY_ROLE_FORM_VALUES,
  });
  const membersState = useUnifiedRoleMembers({
    activeTab,
    isOpen,
    role,
    onMembersChange,
  });
  const permissionsState = useUnifiedRolePermissions({
    isOpen,
    role,
  });

  const isSystemRole = role?.isSystemRole || false;
  const isRoleValid = validateRoleForDrawer(role);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("details");
      setIsSavingRole(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      form.reset();
    };
  }, [form]);

  useEffect(() => {
    if (isOpen && role) {
      form.reset({
        name: role.name || "",
        description: role.description || "",
        is_default: role.isDefault || false,
      });
    }
  }, [form, isOpen, role]);

  const handleRoleFormSubmit = async (data: RoleFormValues) => {
    if (!role?.id) return;

    setIsSavingRole(true);
    try {
      const result = await updateRoleDetails({
        roleId: role.id,
        data,
        permissions: permissionsState.currentPermissions,
      });

      toast.success(`Role "${result.name}" updated successfully`);
      onRoleChange?.();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error((error as Error).message || "Failed to update role");
    } finally {
      setIsSavingRole(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    currentPermissions: permissionsState.currentPermissions,
    form,
    handlePermissionUpdate: permissionsState.handlePermissionUpdate,
    handleRoleFormSubmit,
    isMounted,
    isRoleValid,
    isSavingRole,
    isSystemRole,
    isUpdatingPermissions: permissionsState.isUpdatingPermissions,
    ...membersState,
  };
}
