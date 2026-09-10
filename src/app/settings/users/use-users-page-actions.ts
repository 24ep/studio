"use client";

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';

import type { UnifiedUserFormValues } from '@/components/users/UnifiedUserModal';
import type { UserProfile } from '@/lib/types';
import {
  createUsersPageUser,
  deleteUsersPageUser,
  syncUsersPageFromActiveDirectory,
  toggleUsersPageUserStatus,
  updateUsersPageUser,
} from './users-page-api';
import {
  getUsersPageErrorMessage,
  updateUserInUsersList,
  updateUserStatusInUsersList,
  type UsersPageFilters,
} from './users-page-utils';

interface UseUsersPageActionsOptions {
  currentPage: number;
  getCurrentFilters: () => UsersPageFilters;
  handleModalClose: () => void;
  pageSize: number;
  selectedUser: UserProfile | null;
  sessionUserId?: string;
  setIsSyncing: (isSyncing: boolean) => void;
  setUserToDelete: (user: UserProfile | null) => void;
  setUsers: Dispatch<SetStateAction<UserProfile[]>>;
  updateSession: () => Promise<unknown>;
  userToDelete: UserProfile | null;
  fetchUsers: (
    currentFilters?: UsersPageFilters,
    currentPageParam?: number,
    currentPageSize?: number,
  ) => Promise<void>;
}

export function useUsersPageActions({
  currentPage,
  fetchUsers,
  getCurrentFilters,
  handleModalClose,
  pageSize,
  selectedUser,
  sessionUserId,
  setIsSyncing,
  setUserToDelete,
  setUsers,
  updateSession,
  userToDelete,
}: UseUsersPageActionsOptions) {
  const refreshCurrentPage = useCallback(() => {
    fetchUsers(getCurrentFilters(), currentPage, pageSize);
  }, [currentPage, fetchUsers, getCurrentFilters, pageSize]);

  const handleAddUser = useCallback(async (data: UnifiedUserFormValues) => {
    try {
      await createUsersPageUser(data);
      refreshCurrentPage();
      toast.success('User added successfully.');
      handleModalClose();
    } catch (error) {
      toast.error(getUsersPageErrorMessage(error));
    }
  }, [handleModalClose, refreshCurrentPage]);

  const handleEditUser = useCallback(async (userId: string, data: UnifiedUserFormValues) => {
    try {
      const result = await updateUsersPageUser(userId, data);
      setUsers((previousUsers) => updateUserInUsersList(previousUsers, userId, result));
      toast.success('User updated successfully.');
      handleModalClose();

      if (sessionUserId === userId) {
        await updateSession();
      }
    } catch (error) {
      toast.error(getUsersPageErrorMessage(error));
    }
  }, [handleModalClose, sessionUserId, setUsers, updateSession]);

  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;

    try {
      await deleteUsersPageUser(userToDelete.id);
      refreshCurrentPage();
      toast.success('User deleted.');
    } catch (error) {
      toast.error(getUsersPageErrorMessage(error));
    } finally {
      setUserToDelete(null);
    }
  }, [refreshCurrentPage, setUserToDelete, userToDelete]);

  const handleToggleUserStatus = useCallback(async (user: UserProfile) => {
    try {
      const newStatus = user.isActive === false;
      await toggleUsersPageUserStatus(user.id, newStatus);
      setUsers((previousUsers) => updateUserStatusInUsersList(previousUsers, user.id, newStatus));
      toast.success(`User ${newStatus ? 'enabled' : 'disabled'} successfully.`);
    } catch (error) {
      toast.error(getUsersPageErrorMessage(error));
    }
  }, [setUsers]);

  const handleSyncFromAD = useCallback(async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Syncing with Azure AD...');

    try {
      await syncUsersPageFromActiveDirectory();
      toast.success('Sync completed successfully', { id: toastId });
      refreshCurrentPage();
    } catch (error) {
      toast.error(getUsersPageErrorMessage(error), { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  }, [refreshCurrentPage, setIsSyncing]);

  const handleSaveUser = useCallback((data: UnifiedUserFormValues) => {
    return selectedUser
      ? handleEditUser(selectedUser.id, data)
      : handleAddUser(data);
  }, [handleAddUser, handleEditUser, selectedUser]);

  return {
    handleAddUser,
    handleDeleteUser,
    handleEditUser,
    handleSaveUser,
    handleSyncFromAD,
    handleToggleUserStatus,
  };
}
