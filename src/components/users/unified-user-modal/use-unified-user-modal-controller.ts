"use client";

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { useClickProtection } from '@/hooks/use-click-protection';
import { hasAnyPermission } from '@/lib/permissions';
import type { UserProfile } from '@/lib/types';

import {
  type ModalMode,
  type UnifiedUserCustomFields,
  type UnifiedUserFormValues,
  unifiedUserFormSchema,
} from './types';
import {
  buildUnifiedUserCreateDefaults,
  buildUnifiedUserEditDefaults,
  buildUnifiedUserPermissionModel,
} from './unified-user-modal-utils';
import { useUnifiedUserModalActions } from './use-unified-user-modal-actions';
import { useUnifiedUserModalPreferences } from './use-unified-user-modal-preferences';
import { useUnifiedUserReferenceData } from './use-unified-user-reference-data';

interface UseUnifiedUserModalControllerOptions {
  isOpen: boolean;
  mode: ModalMode;
  user?: UserProfile | null;
  onSave: (data: UnifiedUserFormValues) => Promise<void>;
  onEditUser?: (userId: string, data: UnifiedUserFormValues) => Promise<void>;
  onAddUser?: (data: UnifiedUserFormValues) => Promise<void>;
}

export function useUnifiedUserModalController({
  isOpen,
  mode,
  user,
  onSave,
  onEditUser,
  onAddUser,
}: UseUnifiedUserModalControllerOptions) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [customFields, setCustomFields] = useState<UnifiedUserCustomFields>({});
  const [isLookingUpAD, setIsLookingUpAD] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { handleProtectedAsyncClick } = useClickProtection({
    actionName: 'save user',
    debounceMs: 200,
    timeoutMs: 500,
  });

  const form = useForm<UnifiedUserFormValues>({
    resolver: zodResolver(unifiedUserFormSchema),
    defaultValues: buildUnifiedUserCreateDefaults(),
  });

  const watchedUserGroupIds = form.watch('userGroupIds');
  const hasUserManagePermission = hasAnyPermission(session?.user, [
    'USERS_VIEW',
    'USERS_CREATE',
    'USERS_EDIT',
    'USERS_DELETE',
    'USERS_PERMISSIONS_MANAGE',
  ]);
  const permissions = buildUnifiedUserPermissionModel({
    hasUserManagePermission,
    mode,
    sessionUserId: session?.user?.id,
    userId: user?.id,
  });
  const {
    customFieldDefinitions,
    isLoadingGroups,
    setUserTeams,
    userGroups,
    userTeams,
  } = useUnifiedUserReferenceData({
    canManageTeams: permissions.canManageTeams,
    form,
    isOpen,
    mode,
    watchedUserGroupIds,
  });

  const {
    handleResetPreference,
    isPrefsLoading,
    preferences,
    saveSidebarPref,
    sidebarShowAssigned,
    updatePreferenceInDB,
  } = useUnifiedUserModalPreferences({
    isOpen,
    mode,
    sessionUserId: session?.user?.id,
    targetUserId: user?.id,
  });
  const {
    handleCustomFieldChange,
    handleDisable2FA,
    handleLookupAzureAD,
    onSubmit,
  } = useUnifiedUserModalActions({
    customFields,
    form,
    handleProtectedAsyncClick,
    mode,
    onAddUser,
    onEditUser,
    onSave,
    saveTimeoutRef,
    setCustomFields,
    setIsLoading,
    setIsLookingUpAD,
    user,
  });

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setActiveTab('personal');
      setIsLoading(false);
      setUserTeams([]);
    }
  }, [form, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if ((mode === 'edit' || mode === 'profile') && user) {
      form.reset(buildUnifiedUserEditDefaults(user));
      setCustomFields(user.customFields || {});
    } else {
      form.reset(buildUnifiedUserCreateDefaults());
      setCustomFields({});
    }

    setActiveTab('personal');
  }, [form, isOpen, mode, user]);

  return {
    activeTab,
    setActiveTab,
    form,
    userTeams,
    isLoading,
    userGroups,
    isLoadingGroups,
    sidebarShowAssigned,
    customFields,
    customFieldDefinitions,
    isLookingUpAD,
    preferences,
    isPrefsLoading,
    show2FASetup,
    setShow2FASetup,
    permissions,
    handleCustomFieldChange,
    handleLookupAzureAD,
    handleDisable2FA,
    updatePreferenceInDB,
    handleResetPreference,
    saveSidebarPref,
    onSubmit,
  };
}
