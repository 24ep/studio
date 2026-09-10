"use client";

import { useCallback, useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import type { CustomFieldDefinition } from '@/lib/types';
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import type { CustomFieldFormValues } from './CustomFieldsPageParts';
import {
  canManageCustomFieldDefinitions,
  getCustomFieldSubmitTarget,
  getCustomFieldSuccessMessage,
  type CustomFieldMutationResult,
} from './custom-fields-page-utils';

const CUSTOM_FIELDS_PERMISSION_ERROR = "You do not have permission to manage custom field definitions.";

export function useCustomFieldsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/settings/custom-fields';

  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<CustomFieldDefinition | null>(null);
  const [definitionToDelete, setDefinitionToDelete] = useState<CustomFieldDefinition | null>(null);

  const fetchDefinitions = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/custom-field-definitions');
      if (!response.ok) {
        const errorData = await readJsonOrFallback<{ message?: string }>(response, { message: 'Failed to fetch definitions' });
        if (response.status === 401) {
          signIn(undefined, { callbackUrl: currentPath });
          return;
        } else if (response.status === 403) {
          throw new Error('No permission');
        }
        throw new Error(errorData.message);
      }
      setDefinitions(await readJsonOrFallback<CustomFieldDefinition[]>(response, []));
    } catch (error) {
      console.error('Error in settings/custom-fields:', error);
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, currentPath]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: currentPath });
    } else if (sessionStatus === 'authenticated') {
      if (!canManageCustomFieldDefinitions(session.user)) {
        setFetchError(CUSTOM_FIELDS_PERMISSION_ERROR);
        setIsLoading(false);
      } else {
        fetchDefinitions();
      }
    }
  }, [sessionStatus, session, fetchDefinitions, currentPath]);

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  const handleOpenDrawer = (definition: CustomFieldDefinition) => {
    setEditingDefinition(definition);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (data: CustomFieldFormValues) => {
    const target = getCustomFieldSubmitTarget(editingDefinition);

    try {
      const response = await fetch(target.url, {
        method: target.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await readJsonOrFallback<CustomFieldMutationResult>(response, {});
      if (!response.ok) throw new Error(result.message || `Failed to ${target.action} definition`);

      toast.success(getCustomFieldSuccessMessage({
        fallbackLabel: data.label,
        isEditing: Boolean(editingDefinition),
        result,
      }));
      setIsDrawerOpen(false);
      fetchDefinitions();
    } catch (error) {
      console.error('Error in settings/custom-fields:', error);
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!definitionToDelete) return;
    try {
      const response = await fetch(`/api/settings/custom-field-definitions/${definitionToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await readJsonObject(response);
        throw new Error(getJsonErrorMessage(errorData, 'Failed to delete definition'));
      }
      toast.success('Custom field deleted successfully.');
      fetchDefinitions();
    } catch (error) {
      console.error('Error in settings/custom-fields:', error);
      toast.error((error as Error).message);
    } finally {
      setDefinitionToDelete(null);
    }
  };

  return {
    definitionToDelete,
    definitions,
    editingDefinition,
    fetchError,
    isDrawerOpen,
    isLoading,
    isModalOpen,
    sessionStatus,
    goDashboard: () => router.push('/'),
    handleDelete,
    handleFormSubmit,
    handleOpenDrawer,
    openModal: () => setIsModalOpen(true),
    setDefinitionToDelete,
    setIsDrawerOpen,
    setIsModalOpen,
    showFullPageLoader: sessionStatus === 'loading' ||
      (isLoading && !fetchError && definitions.length === 0 && sessionStatus === 'authenticated'),
  };
}
