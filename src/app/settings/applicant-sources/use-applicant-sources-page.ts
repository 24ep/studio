"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  getJsonErrorMessage,
  readJsonObject,
  readJsonOrFallback,
} from '../../../lib/response-json';
import {
  applyApplicantSourceSaveResult,
  getApplicantSourceErrorMessage,
  saveApplicantSource,
  type ApplicantSourceSettingsFormData,
} from '../../../components/settings/applicant-source-utils';
import type { ApplicantSource } from '@/lib/types';

export function useApplicantSourcesPage(isAuthenticated: boolean) {
  const [sources, setSources] = useState<ApplicantSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ApplicantSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<ApplicantSource | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isImportingAppKit, setIsImportingAppKit] = useState<{ environment: "development" | "production"; percent: number; message: string; } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

      const response = await fetch('/api/settings/applicant-sources');
      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.status}`);
      }

      setSources(await readJsonOrFallback<ApplicantSource[]>(response, []));
    } catch (error) {
      console.error('Failed to fetch sources:', error);
      setFetchError(getApplicantSourceErrorMessage(error, 'Failed to fetch sources'));
      toast.error('Failed to load Applicant sources');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSources();
    }
  }, [fetchSources, isAuthenticated]);

  const openCreateModal = () => {
    setEditingSource(null);
    setIsModalOpen(true);
  };

  const openEditModal = (source: ApplicantSource) => {
    setEditingSource(source);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSource(null);
  };

  const handleModalSubmit = async (data: ApplicantSourceSettingsFormData) => {
    try {
      const result = await saveApplicantSource(data, editingSource);
      setSources(prev => applyApplicantSourceSaveResult(prev, result));
      toast.success(result.mode === 'update'
        ? 'Applicant source updated successfully'
        : 'Applicant source created successfully');

      closeModal();
    } catch (error) {
      console.error('Failed to save source:', error);
      toast.error(getApplicantSourceErrorMessage(error, 'Failed to save Applicant source'));
    }
  };

  const handleDeleteSelected = async () => {
    if (!sourceToDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/applicant-sources/${sourceToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to delete source'));
      }

      setSources(prev => prev.filter(source => source.id !== sourceToDelete.id));
      toast.success('Applicant source deleted successfully');
      setSourceToDelete(null);
    } catch (error) {
      console.error('Failed to delete source:', error);
      toast.error(getApplicantSourceErrorMessage(error, 'Failed to delete Applicant source'));
    }
  };

  const handleLoadFromAppKit = async (environment: 'development' | 'production') => {
    try {
      setIsImportingAppKit({ environment, percent: 10, message: 'Initializing AppKit request' });

      setIsImportingAppKit(current => current ? { ...current, percent: 45, message: 'Downloading Applicant sources' } : null);

      const response = await fetch('/api/settings/applicant-sources/import-appkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment }),
      });

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(
          await readJsonObject(response),
          'Failed to load Applicant sources from AppKit',
        ));
      }

      setIsImportingAppKit(current => current ? { ...current, percent: 85, message: 'Applying Applicant sources' } : null);
      await fetchSources();
      toast.success(`Loaded Applicant sources from AppKit ${environment}`);
    } catch (error) {
      console.error('Failed to load Applicant sources from AppKit:', error);
      toast.error(getApplicantSourceErrorMessage(error, 'Failed to load Applicant sources from AppKit'));
    } finally {
      setIsImportingAppKit(null);
    }
  };

  const handleReorder = async (sourceId: string, newSortOrder: number) => {
    try {
      setIsReordering(true);

      const response = await fetch(`/api/settings/applicant-sources/${sourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: newSortOrder }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sort order');
      }

      await fetchSources();
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Failed to reorder:', error);
      toast.error('Failed to update order');
    } finally {
      setIsReordering(false);
    }
  };

  const handleBulkStatus = async (isActive: boolean) => {
    const ids = Array.from(selectedIds);
    if (!ids.length || isBulkUpdating) return;
    setIsBulkUpdating(true);
    const results = await Promise.allSettled(ids.map(async id => {
      const response = await fetch(`/api/settings/applicant-sources/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error('Update failed');
    }));
    const failed = ids.filter((_, index) => results[index].status === 'rejected');
    setSelectedIds(new Set(failed));
    await fetchSources();
    failed.length ? toast.error(`${ids.length - failed.length} updated; ${failed.length} failed.`) : toast.success(`${ids.length} sources updated.`);
    setIsBulkUpdating(false);
  };

  return {
    sources,
    isLoading,
    fetchError,
    isModalOpen,
    editingSource,
    sourceToDelete,
    isReordering,
    isImportingAppKit,
    fetchSources,
    openCreateModal,
    openEditModal,
    closeModal,
    handleModalSubmit,
    handleDeleteSelected,
    handleLoadFromAppKit,
    setSourceToDelete,
    handleReorder,
    selectedIds,
    setSelectedIds,
    isBulkUpdating,
    handleBulkStatus,
  };
}
