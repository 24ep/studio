"use client";

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

import { hasPermission } from '@/lib/permissions';

import {
  buildCurrentUsersFilterPayload,
} from './users-page-utils';
import { useUsersPageActions } from './use-users-page-actions';
import { useUsersPageControllerState } from './use-users-page-controller-state';
import { useUsersPageFilterOptions } from './use-users-page-filter-options';
import { useUsersPageListLoader } from './use-users-page-list-loader';
import { useUsersPageModalState } from './use-users-page-modal-state';
import { useUsersPageSelection } from './use-users-page-selection';
import { toggleUsersPageUserStatus } from './users-page-api';

const USERS_PAGE_SIZE = 10;

export function useUsersPageController() {
  const router = useRouter();
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/settings/users';

  const controllerState = useUsersPageControllerState();
  const {
    activeTab,
    currentPage,
    emailFilter,
    fetchError,
    isLoading,
    isSyncing,
    isBulkUpdating,
    nameFilter,
    roleFilter,
    setActiveTab,
    setCurrentPage,
    setEmailFilter,
    setFetchError,
    setIsLoading,
    setIsSyncing,
    setIsBulkUpdating,
    setNameFilter,
    setRoleFilter,
    setTeamFilter,
    setUsers,
    setUserToDelete,
    teamFilter,
    users,
    userToDelete,
  } = controllerState;
  const { roles, teams } = useUsersPageFilterOptions(sessionStatus);
  const {
    handleModalClose,
    isUserModalOpen,
    modalMode,
    openUserModal,
    selectedUser,
    setIsUserModalOpen,
  } = useUsersPageModalState();
  const {
    clearSelection,
    handleSelectAllOnPage,
    handleSelectUser,
    isAllSelectedOnPage,
    selectedUserIds,
  } = useUsersPageSelection(users);

  const handleBulkUpdateStatus = useCallback(async (isActive: boolean) => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0 || isBulkUpdating) return;

    setIsBulkUpdating(true);
    const toastId = toast.loading(`${isActive ? 'Activating' : 'Deactivating'} ${ids.length} users...`);
    try {
      const results = await Promise.allSettled(ids.map(id => toggleUsersPageUserStatus(id, isActive)));
      const failedCount = results.filter(result => result.status === 'rejected').length;
      const updatedIds = new Set(ids.filter((_, index) => results[index].status === 'fulfilled'));

      setUsers(previous => previous.map(user => updatedIds.has(user.id) ? { ...user, isActive } : user));
      if (failedCount > 0) {
        toast.error(`${ids.length - failedCount} updated; ${failedCount} failed.`, { id: toastId });
      } else {
        toast.success(`${ids.length} users ${isActive ? 'activated' : 'deactivated'}.`, { id: toastId });
        clearSelection();
      }
    } finally {
      setIsBulkUpdating(false);
    }
  }, [clearSelection, isBulkUpdating, selectedUserIds, setIsBulkUpdating, setUsers]);

  const getCurrentFilters = useCallback(() => buildCurrentUsersFilterPayload({
    nameFilter,
    emailFilter,
    roleFilter,
    teamFilter,
  }), [nameFilter, emailFilter, roleFilter, teamFilter]);

  const fetchUsers = useUsersPageListLoader({
    currentPage,
    currentPath,
    pageSize: USERS_PAGE_SIZE,
    sessionStatus,
    setFetchError,
    setIsLoading,
    setUsers,
  });

  const {
    handleAddUser,
    handleDeleteUser,
    handleEditUser,
    handleSaveUser,
    handleSyncFromAD,
    handleToggleUserStatus,
  } = useUsersPageActions({
    currentPage,
    fetchUsers,
    getCurrentFilters,
    handleModalClose,
    pageSize: USERS_PAGE_SIZE,
    selectedUser,
    sessionUserId: session?.user?.id,
    setIsSyncing,
    setUserToDelete,
    setUsers,
    updateSession,
    userToDelete,
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: currentPath });
      return;
    }

    if (sessionStatus !== 'authenticated') return;

    if (!hasPermission(session.user, 'USERS_VIEW')) {
      router.push('/unauthorized');
      setIsLoading(false);
      return;
    }

    fetchUsers(getCurrentFilters(), currentPage, USERS_PAGE_SIZE);
  }, [sessionStatus, session, currentPath, router, fetchUsers, getCurrentFilters, currentPage]);

  useEffect(() => {
    if (fetchError) toast.error(fetchError);
  }, [fetchError]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchUsers(getCurrentFilters(), 1, USERS_PAGE_SIZE);
  };

  const isInitialLoading = sessionStatus === 'loading' || (isLoading && users.length === 0);

  return {
    activeTab,
    canCreateUsers: hasPermission(session?.user, 'USERS_CREATE'),
    canEditUsers: hasPermission(session?.user, 'USERS_EDIT'),
    clearSelection,
    emailFilter,
    handleAddUser,
    handleApplyFilters,
    handleDeleteUser,
    handleEditUser,
    handleModalClose,
    handleSelectAllOnPage,
    handleSelectUser,
    handleSaveUser,
    handleSyncFromAD,
    handleToggleUserStatus,
    handleBulkUpdateStatus,
    isAllSelectedOnPage,
    isInitialLoading,
    isSyncing,
    isBulkUpdating,
    isUserModalOpen,
    modalMode,
    nameFilter,
    openUserModal,
    roles,
    roleFilter,
    selectedUser,
    selectedUserIds,
    refreshUsers: () => fetchUsers(getCurrentFilters(), currentPage, USERS_PAGE_SIZE),
    setActiveTab,
    setEmailFilter,
    setIsUserModalOpen,
    setNameFilter,
    setRoleFilter,
    setTeamFilter,
    setUserToDelete,
    teamFilter,
    teams,
    users,
    userToDelete,
    goBackToSettings: () => router.push('/settings'),
  };
}
