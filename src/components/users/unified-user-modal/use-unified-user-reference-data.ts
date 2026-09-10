"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { UseFormReturn } from 'react-hook-form';

import type { UserGroup } from '@/lib/types';

import type { ModalMode, UnifiedUserFormValues } from './types';
import {
  getDefaultUnifiedUserGroup,
  getUnifiedUserRoleFromGroupName,
  shouldFetchUnifiedUserTeams,
} from './unified-user-modal-utils';
import {
  loadUnifiedUserCustomFieldDefinitions,
  loadUnifiedUserGroups,
  loadUnifiedUserTeams,
  type UnifiedUserTeamOption,
} from './unified-user-reference-data-api';

interface UseUnifiedUserReferenceDataOptions {
  canManageTeams: boolean;
  form: UseFormReturn<UnifiedUserFormValues>;
  isOpen: boolean;
  mode: ModalMode;
  watchedUserGroupIds: string[];
}

export function useUnifiedUserReferenceData({
  canManageTeams,
  form,
  isOpen,
  mode,
  watchedUserGroupIds,
}: UseUnifiedUserReferenceDataOptions) {
  const [userTeams, setUserTeams] = useState<UnifiedUserTeamOption[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<unknown[]>([]);

  useEffect(() => {
    fetchUserGroups(setUserGroups, setIsLoadingGroups);
  }, []);

  useEffect(() => {
    if (userGroups.length === 0 || mode !== 'create' || !isOpen) return;

    const defaultGroup = getDefaultUnifiedUserGroup(userGroups);
    if (!defaultGroup) return;

    form.setValue('userGroupIds', [defaultGroup.id]);
    form.setValue('role', getUnifiedUserRoleFromGroupName(defaultGroup.name));
  }, [form, isOpen, mode, userGroups]);

  useEffect(() => {
    if (!watchedUserGroupIds || watchedUserGroupIds.length === 0) return;

    const selectedGroup = userGroups.find((group) => group.id === watchedUserGroupIds[0]);
    if (selectedGroup) {
      form.setValue('role', getUnifiedUserRoleFromGroupName(selectedGroup.name));
    }
  }, [form, userGroups, watchedUserGroupIds]);

  useEffect(() => {
    if (!isOpen) {
      setUserTeams([]);
      return;
    }

    if (shouldFetchUnifiedUserTeams({ canManageTeams, mode })) {
      fetchUserTeams(setUserTeams);
    }
  }, [canManageTeams, isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;

    fetchCustomFieldDefinitions(setCustomFieldDefinitions);
  }, [isOpen]);

  return {
    customFieldDefinitions,
    isLoadingGroups,
    setUserTeams,
    userGroups,
    userTeams,
  };
}

async function fetchUserGroups(
  setUserGroups: (groups: UserGroup[]) => void,
  setIsLoadingGroups: (loading: boolean) => void
) {
  setIsLoadingGroups(true);
  try {
    setUserGroups(await loadUnifiedUserGroups());
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
  } finally {
    setIsLoadingGroups(false);
  }
}

async function fetchUserTeams(setUserTeams: (teams: UnifiedUserTeamOption[]) => void) {
  try {
    setUserTeams(await loadUnifiedUserTeams());
  } catch {
    toast.error('Could not load user teams for selection.');
  }
}

async function fetchCustomFieldDefinitions(setCustomFieldDefinitions: (definitions: unknown[]) => void) {
  try {
    setCustomFieldDefinitions(await loadUnifiedUserCustomFieldDefinitions());
  } catch (error) {
    console.error('Failed to fetch custom field definitions:', error);
    setCustomFieldDefinitions([]);
  }
}
