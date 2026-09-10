"use client";

import { useState } from 'react';

import type { UserProfile } from '@/lib/types';
import {
  getUsersPageSelectionSummary,
  selectUsersOnPage,
  toggleUserSelection,
} from './users-page-utils';

export function useUsersPageSelection(users: UserProfile[]) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const { isAllSelectedOnPage } = getUsersPageSelectionSummary(users, selectedUserIds);

  const handleSelectAllOnPage = (checked: boolean) => {
    setSelectedUserIds(selectUsersOnPage(selectedUserIds, users, checked).selectedUserIds);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUserIds(toggleUserSelection(selectedUserIds, userId, checked).selectedUserIds);
  };

  return {
    clearSelection: () => setSelectedUserIds(new Set()),
    handleSelectAllOnPage,
    handleSelectUser,
    isAllSelectedOnPage,
    selectedUserIds,
  };
}
