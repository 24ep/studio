"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { CustomFieldDefinition } from '@/lib/types';
import {
  deleteCustomFieldDefinition,
  fetchCustomFieldDefinitions,
  saveCustomFieldDefinition,
} from './CustomFieldsTabApi';
import type { CustomFieldFormValues } from './CustomFieldsTabTypes';

export function useCustomFieldsTabController(canManageCustomFields: boolean) {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<CustomFieldDefinition | null>(null);
  const [definitionToDelete, setDefinitionToDelete] = useState<CustomFieldDefinition | null>(null);

  const fetchDefinitions = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchCustomFieldDefinitions();
      setDefinitions(data);
    } catch (error) {
      console.error('Error fetching custom field definitions:', error);
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageCustomFields) {
      void fetchDefinitions();
    }
  }, [fetchDefinitions, canManageCustomFields]);

  const handleOpenDrawer = useCallback((definition: CustomFieldDefinition) => {
    setEditingDefinition(definition);
    setIsDrawerOpen(true);
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDefinitionToDelete(null);
  }, []);

  const handleFormSubmit = useCallback(async (data: CustomFieldFormValues) => {
    try {
      const result = await saveCustomFieldDefinition({ data, editingDefinition });
      toast.success(`Definition "${result.label ?? data.label}" was successfully ${editingDefinition ? 'updated' : 'created'}.`);
      setIsDrawerOpen(false);
      void fetchDefinitions();
    } catch (error) {
      console.error('Error in custom fields:', error);
      toast.error((error as Error).message);
    }
  }, [editingDefinition, fetchDefinitions]);

  const handleDelete = useCallback(async () => {
    if (!definitionToDelete) return;

    try {
      await deleteCustomFieldDefinition(definitionToDelete.id);
      toast.success('Custom field deleted successfully.');
      void fetchDefinitions();
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast.error((error as Error).message);
    } finally {
      setDefinitionToDelete(null);
    }
  }, [definitionToDelete, fetchDefinitions]);

  return {
    definitionToDelete,
    definitions,
    editingDefinition,
    fetchError,
    handleCancelDelete,
    handleCloseDrawer,
    handleCloseModal,
    handleDelete,
    handleFormSubmit,
    handleOpenDrawer,
    handleOpenModal,
    isDrawerOpen,
    isLoading,
    isModalOpen,
    setDefinitionToDelete,
  };
}
