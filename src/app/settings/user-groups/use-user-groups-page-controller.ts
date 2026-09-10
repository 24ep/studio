"use client";

import { useCallback, useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import type { UserGroup } from '@/lib/types';

import {
  roleFormSchema,
  type RoleFormValues,
} from './UserGroupsPageParts';
import {
  deleteUserGroupRole,
  fetchUserGroupsList,
  resetUserGroupRolePermissions,
  saveUserGroupRole,
} from './user-groups-page-api';
import {
  buildRoleFormDefaults,
  canViewUserGroups,
  syncSelectedRoleAfterRoleListUpdate,
  validateSelectableRole,
} from './user-groups-page-utils';
import {
  getUserGroupsCurrentPath,
  getUserGroupsFetchFailureMessage,
  shouldShowUserGroupsErrorState,
  shouldShowUserGroupsInitialLoading,
} from './user-groups-page-controller-state-utils';
import { useUserGroupsLogoSetting } from './use-user-groups-logo-setting';

export function useUserGroupsPageController() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const currentPath = getUserGroupsCurrentPath();

  const showLogoOnly = useUserGroupsLogoSetting(sessionStatus);
  const [roles, setRoles] = useState<UserGroup[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserGroup | null>(null);
  const [isUnifiedDrawerOpen, setIsUnifiedDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserGroup | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<UserGroup | null>(null);
  const [roleToReset, setRoleToReset] = useState<UserGroup | null>(null);
  const [isResettingRoleId, setIsResettingRoleId] = useState<string | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: buildRoleFormDefaults(null),
  });

  const fetchRoles = useCallback(async (background = false) => {
    if (sessionStatus !== 'authenticated') {
      return;
    }

    if (!background) setIsLoading(true);
    setFetchError(null);

    try {
      const result = await fetchUserGroupsList();

      if (!result.ok) {
        if (result.status === 401) {
          signIn(undefined, { callbackUrl: currentPath });
          return;
        }

        throw new Error(getUserGroupsFetchFailureMessage(result));
      }

      setRoles(result.roles);
      setSelectedRole((prevSelected) => (
        syncSelectedRoleAfterRoleListUpdate(result.roles, prevSelected)
      ));
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      if (!background) setIsLoading(false);
    }
  }, [currentPath, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: currentPath });
      return;
    }

    if (sessionStatus !== 'authenticated') {
      return;
    }

    if (!canViewUserGroups(session.user)) {
      setFetchError('You do not have permission to manage user groups.');
      setIsLoading(false);
      return;
    }

    void fetchRoles();
  }, [currentPath, fetchRoles, session, sessionStatus]);

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  const handleSelectRole = useCallback((role: UserGroup) => {
    const validation = validateSelectableRole(role);
    if (!validation.valid) {
      console.error(validation.logMessage, role.id);
      toast.error(validation.userMessage);
      return;
    }

    setSelectedRole(role);
    setIsUnifiedDrawerOpen(true);
  }, []);

  const handleOpenModal = useCallback((role: UserGroup | null = null) => {
    setEditingRole(role);
    form.reset(buildRoleFormDefaults(role));
    setIsModalOpen(true);
  }, [form]);

  const handleRoleFormSubmit = useCallback(async (data: RoleFormValues) => {
    try {
      const result = await saveUserGroupRole(editingRole, data);
      toast.success(`Role "${result.name}" was successfully ${result.isEditing ? 'updated' : 'created'}.`);
      setIsModalOpen(false);
      await fetchRoles();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [editingRole, fetchRoles]);

  const handleDelete = useCallback(async () => {
    if (!roleToDelete) {
      setRoleToDelete(null);
      return;
    }

    try {
      await deleteUserGroupRole(roleToDelete.id);
      toast.success('Role deleted successfully.');
      await fetchRoles();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRoleToDelete(null);
    }
  }, [fetchRoles, roleToDelete]);

  const handleResetPermissions = useCallback(async () => {
    if (!roleToReset) {
      return;
    }

    setIsResettingRoleId(roleToReset.id);
    try {
      toast.success(await resetUserGroupRolePermissions(roleToReset));
      await fetchRoles(true);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsResettingRoleId(null);
      setRoleToReset(null);
    }
  }, [fetchRoles, roleToReset]);

  return {
    editingRole,
    fetchError,
    form,
    handleDelete,
    handleOpenModal,
    handleResetPermissions,
    handleRoleFormSubmit,
    handleSelectRole,
    isInitialLoading: shouldShowUserGroupsInitialLoading({
      fetchError,
      isLoading,
      roles,
      selectedRole,
      sessionStatus,
    }),
    isLoading,
    isModalOpen,
    isResettingRoleId,
    isUnifiedDrawerOpen,
    refreshRolesInBackground: () => fetchRoles(true),
    roleToDelete,
    roleToReset,
    roles,
    selectedRole,
    setIsModalOpen,
    setIsUnifiedDrawerOpen,
    setRoleToDelete,
    setRoleToReset,
    showErrorState: shouldShowUserGroupsErrorState(fetchError, isLoading),
    showLogoOnly,
    goToDashboard: () => router.push('/dashboard'),
  };
}
