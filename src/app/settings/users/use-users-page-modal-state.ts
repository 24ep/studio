"use client";

import { useState } from 'react';

import type { ModalMode } from '@/components/users/UnifiedUserModal';
import type { UserProfile } from '@/lib/types';

export function useUsersPageModalState() {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleModalClose = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const openUserModal = (mode: ModalMode, user?: UserProfile) => {
    setModalMode(mode);
    setSelectedUser(user || null);
    setIsUserModalOpen(true);
  };

  return {
    handleModalClose,
    isUserModalOpen,
    modalMode,
    openUserModal,
    selectedUser,
    setIsUserModalOpen,
  };
}
