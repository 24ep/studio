"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { Interviewer, InterviewerUser } from './interviewer-tab-types';
import {
  addPositionInterviewers,
  fetchAvailableInterviewerUsers,
  fetchPositionInterviewers,
  removePositionInterviewer,
} from './interviewer-tab-api';
import {
  getFilteredAvailableUsers,
  getFilteredInterviewers,
  getSelectedUsers,
  isBlankEntityId,
  isValidUuid,
} from './interviewer-tab-utils';

interface UseInterviewerTabProps {
  positionId: string;
}

export function useInterviewerTab({ positionId }: UseInterviewerTabProps) {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [availableUsers, setAvailableUsers] = useState<InterviewerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isRemovingUser, setIsRemovingUser] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadInterviewers = async () => {
    if (isBlankEntityId(positionId)) {
      console.warn('[InterviewerTab] Cannot load interviewers: positionId is invalid', positionId);
      return;
    }

    try {
      setInterviewers(await fetchPositionInterviewers(positionId));
    } catch (error) {
      console.error('Error loading interviewers:', error);
      toast.error('Failed to load interviewers');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      setAvailableUsers(await fetchAvailableInterviewerUsers());
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleAddInterviewers = async () => {
    if (selectedUserIds.size === 0) {
      console.warn('[InterviewerTab] Attempted to add interviewers but no users selected');
      return;
    }

    if (isBlankEntityId(positionId)) {
      console.error('[InterviewerTab] Invalid position ID:', positionId);
      toast.error('Invalid position. Please refresh the page and try again.');
      return;
    }

    if (!isValidUuid(positionId)) {
      console.error('[InterviewerTab] Position ID is not a valid UUID:', positionId);
      toast.error('Invalid position ID format. Please refresh the page and try again.');
      return;
    }

    setIsAddingUser(true);
    const selectedIds = Array.from(selectedUserIds);

    try {
      const result = await addPositionInterviewers({
        availableUsers,
        positionId,
        userIds: selectedIds,
      });

      if (result.successCount > 0) {
        toast.success(`${result.successCount} interviewer${result.successCount > 1 ? 's' : ''} added successfully`);
      }

      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} failed: ${result.errors.join('; ')}`);
      }

      if (result.successCount > 0) {
        setSelectedUserIds(new Set());
        setDropdownOpen(false);
        setDropdownSearchTerm('');
        loadInterviewers();
      }
    } catch (error) {
      console.error('[InterviewerTab] Unexpected error adding interviewers:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((currentSelected) => {
      const nextSelected = new Set(currentSelected);
      if (nextSelected.has(userId)) {
        nextSelected.delete(userId);
      } else {
        nextSelected.add(userId);
      }
      return nextSelected;
    });
  };

  const handleRemoveFromSelection = (userId: string) => {
    setSelectedUserIds((currentSelected) => {
      const nextSelected = new Set(currentSelected);
      nextSelected.delete(userId);
      return nextSelected;
    });
  };

  const handleRemoveInterviewer = async (userId: string, userName: string) => {
    if (isBlankEntityId(positionId)) {
      toast.error('Invalid position. Please refresh the page and try again.');
      return;
    }

    if (isBlankEntityId(userId)) {
      toast.error('Invalid user ID');
      return;
    }

    setIsRemovingUser(userId);
    try {
      await removePositionInterviewer(positionId, userId);
      toast.success(`${userName} removed as interviewer successfully`);
      loadInterviewers();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsRemovingUser(null);
    }
  };

  useEffect(() => {
    if (isBlankEntityId(positionId)) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadInterviewers(), loadAvailableUsers()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [positionId]);

  return {
    interviewers,
    availableUsers,
    filteredInterviewers: getFilteredInterviewers(interviewers, searchTerm),
    filteredAvailableUsers: getFilteredAvailableUsers({
      users: availableUsers,
      interviewers,
      searchTerm: dropdownSearchTerm,
    }),
    selectedUsers: getSelectedUsers(availableUsers, selectedUserIds),
    isLoading,
    isAddingUser,
    isRemovingUser,
    selectedUserIds,
    setSelectedUserIds,
    dropdownOpen,
    setDropdownOpen,
    dropdownSearchTerm,
    setDropdownSearchTerm,
    searchTerm,
    setSearchTerm,
    handleAddInterviewers,
    handleToggleUser,
    handleRemoveFromSelection,
    handleRemoveInterviewer,
  };
}
