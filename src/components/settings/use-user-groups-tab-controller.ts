"use client";

import { useCallback, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn, type SessionContextValue } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { hasAnyPermission } from '@/lib/permissions';
import type { UserGroup } from '@/lib/types';
import {
  deleteUserGroupRole,
  fetchUserGroups,
  saveUserGroupRole,
} from './user-groups-tab-api';
import {
  buildRoleFormDefaults,
  hasDuplicateRoleName,
  normalizeSelectableRole,
  roleFormSchema,
  type RoleFormValues,
} from './user-groups-tab-utils';

export function useUserGroupsTabController({
  pathname,
  session,
  sessionStatus,
}: {
  pathname: string;
  session: SessionContextValue['data'];
  sessionStatus: SessionContextValue['status'];
}) {
  const [roles, setRoles] = useState<UserGroup[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserGroup | null>(null);
  const [isUnifiedDrawerOpen, setIsUnifiedDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserGroup | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<UserGroup | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: buildRoleFormDefaults(),
  });

  const canManageRoles = session?.user?.role === 'Admin' ||
    hasAnyPermission(session?.user, [
      'USERS_PERMISSIONS_MANAGE',
      'USER_GROUPS_CREATE',
      'USER_GROUPS_EDIT',
      'USER_GROUPS_DELETE',
    ]);

  const fetchRoles = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;

    setIsLoading(true);
    setFetchError(null);

    try {
      const result = await fetchUserGroups();
      if (result.status === 'unauthorized') {
        signIn(undefined, { callbackUrl: pathname });
        return;
      }

      setRoles(result.data);
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [pathname, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }

    if (sessionStatus !== 'authenticated' || !session) return;

    if (!hasAnyPermission(session.user, ['USER_GROUPS_VIEW'])) {
      setFetchError("You do not have permission to manage roles & permissions.");
      setIsLoading(false);
      return;
    }

    void fetchRoles();
  }, [fetchRoles, pathname, session, sessionStatus]);

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  const handleSelectRole = useCallback((role: UserGroup) => {
    if (!canManageRoles) {
      toast.error('You do not have permission to manage roles and permissions.');
      return;
    }

    const normalizedRole = normalizeSelectableRole(role);
    if (!normalizedRole) {
      console.error('UserGroupsTab: Invalid role data:', role);
      toast.error('Invalid role data. Please try refreshing the page.');
      return;
    }

    setSelectedRole(normalizedRole);
    setIsUnifiedDrawerOpen(true);
  }, [canManageRoles]);

  const handleOpenModal = useCallback((role: UserGroup | null = null) => {
    setEditingRole(role);
    form.reset(buildRoleFormDefaults(role));
    setIsModalOpen(true);
  }, [form]);

  const handleRoleFormSubmit = useCallback(async (data: RoleFormValues) => {
    if (hasDuplicateRoleName(roles, data.name, editingRole)) {
      toast.error(`A user group with the name "${data.name}" already exists.`);
      return;
    }

    try {
      const result = await saveUserGroupRole({ data, editingRole });
      toast.success(`Role "${result.name}" was successfully ${editingRole ? 'updated' : 'created'}.`);
      setIsModalOpen(false);
      void fetchRoles();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [editingRole, fetchRoles, roles]);

  const handleDeleteRole = useCallback(async () => {
    if (!roleToDelete) return;

    try {
      await deleteUserGroupRole(roleToDelete.id);
      toast.success(`Role "${roleToDelete.name}" was successfully deleted.`);
      setRoleToDelete(null);
      void fetchRoles();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [fetchRoles, roleToDelete]);

  return {
    canManageRoles,
    editingRole,
    fetchError,
    fetchRoles,
    form,
    handleDeleteRole,
    handleOpenModal,
    handleRoleFormSubmit,
    handleSelectRole,
    isLoading,
    isModalOpen,
    isUnifiedDrawerOpen,
    roleToDelete,
    roles,
    selectedRole,
    setIsModalOpen,
    setIsUnifiedDrawerOpen,
    setRoleToDelete,
  };
}
