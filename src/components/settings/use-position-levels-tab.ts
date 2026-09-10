"use client";

import { useCallback, useEffect, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';

import type { PositionLevel } from '@/lib/types';

import {
  deletePositionLevel,
  fetchPositionLevels,
  loadPositionLevelsFromAppKit,
  savePositionLevel,
  updatePositionLevelSortOrder,
} from './position-levels-api';
import {
  buildPositionLevelFormData,
  buildPositionLevelPayload,
  defaultPositionLevelFormData,
  type PositionLevelFormData,
} from './position-levels-types';

type AppKitLoadState = {
  environment: 'development' | 'production';
  percent: number;
  message: string;
};

export function usePositionLevelsTab() {
  const [levels, setLevels] = useState<PositionLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<PositionLevel | null>(null);
  const [levelToDelete, setLevelToDelete] = useState<PositionLevel | null>(null);
  const [formData, setFormData] = useState<PositionLevelFormData>(defaultPositionLevelFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appKitLoad, setAppKitLoad] = useState<AppKitLoadState | null>(null);
  const isImportingAppKit = appKitLoad !== null;

  const loadLevels = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      setLevels(await fetchPositionLevels());
    } catch (error) {
      console.error('[PositionLevelsTab] Error fetching position levels:', error);
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const openModal = useCallback((level?: PositionLevel) => {
    setEditingLevel(level || null);
    setFormData(buildPositionLevelFormData(level));
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingLevel(null);
    setFormData(defaultPositionLevelFormData);
  }, []);

  const submitForm = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await savePositionLevel(editingLevel?.id ?? null, formData);
      toast.success(editingLevel
        ? 'Position level updated successfully'
        : 'Position level created successfully');
      closeModal();
      loadLevels();
    } catch (error) {
      console.error('Error saving position level:', error);
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [closeModal, editingLevel, formData, loadLevels]);

  const deleteSelectedLevel = useCallback(async () => {
    if (!levelToDelete) return;

    try {
      await deletePositionLevel(levelToDelete.id);
      toast.success('Position level deleted successfully');
      setLevelToDelete(null);
      loadLevels();
    } catch (error) {
      console.error('Error deleting position level:', error);
      toast.error((error as Error).message);
    }
  }, [levelToDelete, loadLevels]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(levels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLevels(items);

    try {
      const updates = items.map((level, index) => ({
        ...level,
        sortOrder: index + 1,
      }));

      await Promise.all(
        updates.map((level) =>
          updatePositionLevelSortOrder(level.id, buildPositionLevelPayload(level))
        )
      );
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast.error('Failed to update sort order');
      loadLevels();
    }
  }, [levels, loadLevels]);

  const handleLoadFromAppKit = useCallback(async (environment: 'development' | 'production') => {
    try {
      setAppKitLoad({ environment, percent: 10, message: 'Initializing AppKit request' });
      await loadPositionLevelsFromAppKit(environment);
      setAppKitLoad((current) => current ? { ...current, percent: 65, message: 'Applying position levels' } : null);
      await loadLevels();
      setAppKitLoad((current) => current ? { ...current, percent: 95, message: 'Refreshing list' } : null);
      toast.success(`Loaded position levels from AppKit ${environment}`);
    } catch (error) {
      console.error('Error loading position levels from AppKit:', error);
      toast.error((error as Error).message);
    } finally {
      setAppKitLoad(null);
    }
  }, [loadLevels]);

  return {
    closeModal,
    deleteSelectedLevel,
    editingLevel,
    fetchError,
    formData,
    handleDragEnd,
    isLoading,
    isModalOpen,
    isImportingAppKit,
    appKitLoad,
    isSubmitting,
    levelToDelete,
    levels,
    loadLevels,
    handleLoadFromAppKit,
    openModal,
    setFormData,
    setIsModalOpen,
    setLevelToDelete,
    submitForm,
  };
}
