"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import type { UserGroup } from "@/lib/types";
import type { UnifiedRoleMember } from "./UnifiedRoleMembersTab";
import type { AvailableRoleUser } from "./UnifiedRoleDrawerParts";
import {
  addUserToRole,
  loadAvailableRoleUsers,
  loadRoleMembers,
  removeUserFromRole,
} from "./unified-role-drawer-api";
import {
  getUnifiedRoleErrorMessage,
  getRoleUserAddPayload,
  isUnifiedRoleAbortError,
  shouldLoadAvailableRoleUsers,
  shouldLoadUnifiedRoleMembers,
} from "./use-unified-role-members-utils";

interface UseUnifiedRoleMembersOptions {
  activeTab: string;
  isOpen: boolean;
  role: UserGroup | null;
  onMembersChange?: () => void;
}

export function useUnifiedRoleMembers({
  activeTab,
  isOpen,
  role,
  onMembersChange,
}: UseUnifiedRoleMembersOptions) {
  const [members, setMembers] = useState<UnifiedRoleMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableRoleUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRemovingUser, setIsRemovingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberPage, setMemberPage] = useState(1);

  const loadGroupMembers = useCallback(async () => {
    if (!role?.id) return;

    const abortController = new AbortController();

    setIsLoadingMembers(true);
    try {
      setMembers(await loadRoleMembers(role.id, abortController.signal));
    } catch (error) {
      if (isUnifiedRoleAbortError(error)) {
        return;
      }

      console.error("Error loading group members:", error);
      toast.error(getUnifiedRoleErrorMessage(error, "Failed to load group members"));
    } finally {
      setIsLoadingMembers(false);
    }
  }, [role?.id]);

  const loadAvailableUsers = useCallback(async () => {
    if (!role?.id) return;

    const abortController = new AbortController();

    setIsLoadingAvailable(true);
    try {
      setAvailableUsers(await loadAvailableRoleUsers(searchTerm, abortController.signal));
    } catch (error) {
      if (isUnifiedRoleAbortError(error)) {
        return;
      }

      console.error("Error loading users:", error);
      toast.error(getUnifiedRoleErrorMessage(error, "Failed to load users"));
    } finally {
      setIsLoadingAvailable(false);
    }
  }, [role?.id, searchTerm]);

  useEffect(() => {
    if (shouldLoadUnifiedRoleMembers({ activeTab, isOpen, roleId: role?.id })) {
      loadGroupMembers();
    }
  }, [activeTab, isOpen, loadGroupMembers, role?.id]);

  useEffect(() => {
    if (shouldLoadAvailableRoleUsers({ isAddUserModalOpen, roleId: role?.id })) {
      loadAvailableUsers();
    }
  }, [isAddUserModalOpen, loadAvailableUsers, role?.id]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setMembers([]);
    setAvailableUsers([]);
    setIsLoadingMembers(false);
    setIsLoadingAvailable(false);
    setIsAddUserModalOpen(false);
    setSelectedUserId("");
    setSearchTerm("");
    setIsRemovingUser(null);
    setIsAddingUser(false);
    setMemberSearchTerm("");
    setMemberPage(1);
  }, [isOpen]);

  const handleAddUser = async () => {
    const addPayload = getRoleUserAddPayload({ roleId: role?.id, selectedUserId });
    if (!addPayload) return;

    setIsAddingUser(true);
    try {
      await addUserToRole(addPayload.roleId, addPayload.selectedUserId);
      toast.success("User added to group successfully");
      setIsAddUserModalOpen(false);
      setSelectedUserId("");
      loadGroupMembers();
      onMembersChange?.();
    } catch (error) {
      console.error("Error adding user to group:", error);
      toast.error(getUnifiedRoleErrorMessage(error, "Failed to add user to group"));
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!role?.id) return;

    setIsRemovingUser(userId);
    try {
      await removeUserFromRole(role.id, userId);
      toast.success(`User ${userName} removed from group successfully`);
      loadGroupMembers();
      onMembersChange?.();
    } catch (error) {
      console.error("Error removing user from group:", error);
      toast.error(getUnifiedRoleErrorMessage(error, "Failed to remove user from group"));
    } finally {
      setIsRemovingUser(null);
    }
  };

  const handleMemberSearchChange = (value: string) => {
    setMemberSearchTerm(value);
    setMemberPage(1);
  };

  const handleCancelAddUser = () => {
    setIsAddUserModalOpen(false);
    setSelectedUserId("");
    setSearchTerm("");
  };

  return {
    availableUsers,
    handleAddUser,
    handleCancelAddUser,
    handleMemberSearchChange,
    handleRemoveUser,
    isAddingUser,
    isAddUserModalOpen,
    isLoadingAvailable,
    isLoadingMembers,
    isRemovingUser,
    memberPage,
    memberSearchTerm,
    members,
    searchTerm,
    selectedUserId,
    setIsAddUserModalOpen,
    setMemberPage,
    setSearchTerm,
    setSelectedUserId,
  };
}
