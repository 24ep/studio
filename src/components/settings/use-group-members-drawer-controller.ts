"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { UserGroup } from '@/lib/types';
import { getJsonArray, getJsonErrorMessage, isJsonObject, readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import {
  buildAvailableGroupUsersUrl,
  getGroupMembersErrorMessage,
  normalizeAvailableGroupUsersResponse,
  type GroupMemberUser,
} from './group-members-drawer-utils';

interface UseGroupMembersDrawerControllerOptions {
  isOpen: boolean;
  group: UserGroup | null;
  onMembersChange?: () => void;
}

export function useGroupMembersDrawerController({
  isOpen,
  group,
  onMembersChange,
}: UseGroupMembersDrawerControllerOptions) {
  const [members, setMembers] = useState<GroupMemberUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<GroupMemberUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRemovingUser, setIsRemovingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const normalizeGroupUsers = (value: unknown) => (
    isJsonObject(value)
      ? (getJsonArray(value, 'users') ?? []).filter(isJsonObject).map((user) => user as unknown as GroupMemberUser)
      : []
  );

  const loadGroupMembers = useCallback(async () => {
    if (!group) return;

    setIsLoadingMembers(true);
    try {
      const response = await fetch(`/api/settings/user-groups/${group.id}/members`);
      if (!response.ok) {
        throw new Error('Failed to load group members');
      }
      setMembers(normalizeGroupUsers(await readJsonOrFallback<unknown>(response, {})));
    } catch (error) {
      console.error('Error loading group members:', error);
      toast.error('Failed to load group members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [group]);

  const loadAvailableUsers = useCallback(async () => {
    if (!group) return;

    setIsLoadingAvailable(true);
    try {
      const url = buildAvailableGroupUsersUrl(window.location.origin, searchTerm);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      setAvailableUsers(normalizeAvailableGroupUsersResponse(await readJsonOrFallback<unknown>(response, {})));
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingAvailable(false);
    }
  }, [group, searchTerm]);

  useEffect(() => {
    if (isOpen && group) {
      loadGroupMembers();
    }
  }, [group, isOpen, loadGroupMembers]);

  useEffect(() => {
    if (isAddUserModalOpen && group) {
      loadAvailableUsers();
    }
  }, [group, isAddUserModalOpen, loadAvailableUsers]);

  const handleAddUser = async () => {
    if (!selectedUserId || !group) return;

    setIsAddingUser(true);
    try {
      const response = await fetch(`/api/settings/user-groups/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to add user to group'));
      }

      toast.success('User added to group successfully');
      setIsAddUserModalOpen(false);
      setSelectedUserId('');
      loadGroupMembers();
      onMembersChange?.();
    } catch (error) {
      console.error('Error adding user to group:', error);
      toast.error(getGroupMembersErrorMessage(error, 'Failed to add user to group'));
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = useCallback(async (userId: string, userName: string) => {
    if (!group) return;

    setIsRemovingUser(userId);
    try {
      const response = await fetch(`/api/settings/user-groups/${group.id}/members?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to remove user from group'));
      }

      toast.success(`User ${userName} removed from group successfully`);
      loadGroupMembers();
      onMembersChange?.();
    } catch (error) {
      console.error('Error removing user from group:', error);
      toast.error(getGroupMembersErrorMessage(error, 'Failed to remove user from group'));
    } finally {
      setIsRemovingUser(null);
    }
  }, [group, loadGroupMembers, onMembersChange]);

  const handleCancelAddUser = () => {
    setIsAddUserModalOpen(false);
    setSelectedUserId('');
    setSearchTerm('');
  };

  return {
    members,
    availableUsers,
    isLoadingMembers,
    isLoadingAvailable,
    isAddUserModalOpen,
    setIsAddUserModalOpen,
    selectedUserId,
    setSelectedUserId,
    searchTerm,
    setSearchTerm,
    isRemovingUser,
    isAddingUser,
    handleAddUser,
    handleRemoveUser,
    handleCancelAddUser,
  };
}
