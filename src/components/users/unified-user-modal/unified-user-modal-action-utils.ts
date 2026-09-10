import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { readJsonOrFallback } from '@/lib/response-json';
import type { UserProfile } from '@/lib/types';

import type {
  ModalMode,
  UnifiedUserAzureAdUser,
  UnifiedUserCustomFields,
  UnifiedUserFormValues,
} from './types';
import {
  buildUnifiedUserSavePayload,
  getUnifiedUserAzureAdSuccessMessage,
  mergeUnifiedUserAzureAdFields,
  withAzureAdAuthenticationMethod,
} from './unified-user-modal-utils';

export async function lookupAzureAdUser({
  customFields,
  email,
  form,
  setCustomFields,
}: {
  customFields: UnifiedUserCustomFields;
  email: string;
  form: UseFormReturn<UnifiedUserFormValues>;
  setCustomFields: Dispatch<SetStateAction<UnifiedUserCustomFields>>;
}) {
  const response = await fetch(`/api/users/lookup-ad?email=${encodeURIComponent(email)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    await handleAzureAdLookupError(response);
    return;
  }

  const adUser = await readJsonOrFallback<UnifiedUserAzureAdUser>(response, {});
  const currentMethods = form.getValues('authenticationMethods') || [];
  form.setValue('authenticationMethods', withAzureAdAuthenticationMethod(currentMethods));

  const { formUpdates, customFields: updatedCustomFields } = mergeUnifiedUserAzureAdFields({
    currentCustomFields: customFields,
    adUser,
  });

  if (formUpdates.name) {
    form.setValue('name', formUpdates.name);
  }
  if (formUpdates.positionTitle) {
    form.setValue('positionTitle', formUpdates.positionTitle);
  }

  setCustomFields(updatedCustomFields);
  toast.success(getUnifiedUserAzureAdSuccessMessage(adUser));
}

export async function saveUnifiedUser({
  customFields,
  data,
  mode,
  onAddUser,
  onEditUser,
  onSave,
  user,
}: {
  customFields: UnifiedUserCustomFields;
  data: UnifiedUserFormValues;
  mode: ModalMode;
  onAddUser?: (data: UnifiedUserFormValues) => Promise<void>;
  onEditUser?: (userId: string, data: UnifiedUserFormValues) => Promise<void>;
  onSave: (data: UnifiedUserFormValues) => Promise<void>;
  user?: UserProfile | null;
}) {
  const dataWithCustomFields = buildUnifiedUserSavePayload(data, customFields);

  if (mode === 'create' && onAddUser) {
    await onAddUser(dataWithCustomFields);
  } else if (mode === 'edit' && onEditUser && user) {
    await onEditUser(user.id, dataWithCustomFields);
  } else if (mode === 'profile') {
    await onSave(dataWithCustomFields);
  }
}

export function waitForSaveSettling(saveTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  return new Promise<void>((resolve) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(resolve, 100);
  });
}

async function handleAzureAdLookupError(response: Response) {
  if (response.status === 404) {
    toast.error('User not found in Azure AD');
    return;
  }

  const errorData = await readJsonOrFallback<{ message?: string }>(response, { message: 'Failed to lookup user' });
  toast.error(errorData.message || 'Failed to lookup user in Azure AD');
}
