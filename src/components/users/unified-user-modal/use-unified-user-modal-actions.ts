"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { getJsonString, readJsonObject } from '@/lib/response-json';
import type { CustomFieldValue, UserProfile } from '@/lib/types';

import type {
  ModalMode,
  UnifiedUserCustomFields,
  UnifiedUserFormValues,
} from './types';
import {
  lookupAzureAdUser,
  saveUnifiedUser,
  waitForSaveSettling,
} from './unified-user-modal-action-utils';

interface UseUnifiedUserModalActionsOptions {
  customFields: UnifiedUserCustomFields;
  form: UseFormReturn<UnifiedUserFormValues>;
  handleProtectedAsyncClick: (handler: () => Promise<void>) => Promise<void>;
  mode: ModalMode;
  onAddUser?: (data: UnifiedUserFormValues) => Promise<void>;
  onEditUser?: (userId: string, data: UnifiedUserFormValues) => Promise<void>;
  onSave: (data: UnifiedUserFormValues) => Promise<void>;
  saveTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setCustomFields: Dispatch<SetStateAction<UnifiedUserCustomFields>>;
  setIsLoading: (loading: boolean) => void;
  setIsLookingUpAD: (loading: boolean) => void;
  user?: UserProfile | null;
}

export function useUnifiedUserModalActions({
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
}: UseUnifiedUserModalActionsOptions) {
  const handleCustomFieldChange = useCallback((fieldCode: string, value: CustomFieldValue) => {
    setCustomFields((previous) => ({
      ...previous,
      [fieldCode]: value,
    }));
  }, [setCustomFields]);

  const handleDisable2FA = useCallback(async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/disable', { method: 'POST' });
      if (response.ok) {
        toast.success('2FA disabled successfully');
        window.location.reload();
      } else {
        const data = await readJsonObject(response);
        toast.error(getJsonString(data, 'error') || 'Failed to disable 2FA');
      }
    } catch {
      toast.error('Error disabling 2FA');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const handleLookupAzureAD = useCallback(async () => {
    const email = form.getValues('email');
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address first');
      return;
    }

    setIsLoading(true);
    setIsLookingUpAD(true);
    try {
      await lookupAzureAdUser({
        customFields,
        email,
        form,
        setCustomFields,
      });
    } catch (error) {
      console.error('Error looking up Azure AD user:', error);
      toast.error('Failed to lookup user in Azure AD');
    } finally {
      setIsLookingUpAD(false);
      setIsLoading(false);
    }
  }, [customFields, form, setCustomFields, setIsLoading, setIsLookingUpAD]);

  const onSubmit = useCallback(async (data: UnifiedUserFormValues) => {
    await handleProtectedAsyncClick(async () => {
      setIsLoading(true);
      try {
        await saveUnifiedUser({
          customFields,
          data,
          mode,
          onAddUser,
          onEditUser,
          onSave,
          user,
        });
        await waitForSaveSettling(saveTimeoutRef);
      } catch {
        toast.error('Failed to save user data');
      } finally {
        setIsLoading(false);
      }
    });
  }, [customFields, handleProtectedAsyncClick, mode, onAddUser, onEditUser, onSave, saveTimeoutRef, setIsLoading, user]);

  return {
    handleCustomFieldChange,
    handleDisable2FA,
    handleLookupAzureAD,
    onSubmit,
  };
}
