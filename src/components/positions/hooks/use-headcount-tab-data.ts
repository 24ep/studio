"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { CustomFieldDefinition, Headcount, HeadcountType } from '@/lib/types';
import type { HeadcountModalSaveData } from '../HeadcountModalTypes';
import {
  deleteHeadcountById,
  FALLBACK_HEADCOUNT_TYPE_OPTIONS,
  fetchHeadcountCustomFields,
  fetchHeadcountSLAForItems,
  fetchHeadcountTypeOptions as fetchHeadcountTypeOptionsApi,
  fetchHeadcountsForPosition,
  saveHeadcountForPosition,
} from './headcount-tab-api';

export interface HeadcountTypeOption {
  value: HeadcountType;
  label: string;
  color?: string;
}

export interface HeadcountSLAData {
  violation?: {
    isViolated?: boolean;
    daysOverdue?: number;
    daysRemaining?: number;
  } | null;
  remainingDays?: number | null;
  error?: string;
}

export function useHeadcountTabData(positionId: string, onHeadcountChange?: () => void) {
  const [headcountTypeOptions, setHeadcountTypeOptions] = useState<HeadcountTypeOption[]>([]);
  const [headcounts, setHeadcounts] = useState<Headcount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [headcountSLA, setHeadcountSLA] = useState<Record<string, HeadcountSLAData>>({});

  const fetchHeadcountTypeOptions = useCallback(async () => {
    try {
      const options = await fetchHeadcountTypeOptionsApi();

      if (options) {
        setHeadcountTypeOptions(options);
      }
    } catch (error) {
      console.error('Error fetching headcount type options:', error);
      setHeadcountTypeOptions(FALLBACK_HEADCOUNT_TYPE_OPTIONS);
    }
  }, []);

  const fetchCustomFieldDefinitions = useCallback(async () => {
    try {
      const definitions = await fetchHeadcountCustomFields();
      setCustomFieldDefinitions(definitions);
    } catch (error) {
      console.error('Error fetching custom field definitions:', error);
    }
  }, []);

  const fetchHeadcounts = useCallback(async () => {
    if (!positionId) {
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchHeadcountsForPosition(positionId);
      setHeadcounts(data);
      return data;
    } catch (error) {
      console.error('Error fetching headcounts:', error);
      setError('Failed to load headcounts');
      toast.error('Failed to load headcounts');
      return [];
    } finally {
      setLoading(false);
    }
  }, [positionId]);

  const fetchHeadcountSLA = useCallback(async (items: Headcount[]) => {
    if (items.length === 0) {
      setHeadcountSLA({});
      return;
    }

    setHeadcountSLA(await fetchHeadcountSLAForItems(items));
  }, []);

  const deleteHeadcount = useCallback(async (headcountId: string) => {
    try {
      await deleteHeadcountById(headcountId);
      toast.success('Headcount deleted successfully');
      await fetchHeadcounts();
      onHeadcountChange?.();
    } catch (error) {
      console.error('Error deleting headcount:', error);
      toast.error('Failed to delete headcount');
    }
  }, [fetchHeadcounts, onHeadcountChange]);

  const saveHeadcount = useCallback(async (headcountData: HeadcountModalSaveData, editingHeadcount: Headcount | null) => {
    try {
      await saveHeadcountForPosition({
        editingHeadcount,
        headcountData,
        positionId,
      });

      toast.success(editingHeadcount ? 'Headcount updated successfully' : 'Headcount submitted for approval');
      await fetchHeadcounts();
      onHeadcountChange?.();
    } catch (error) {
      console.error('Error saving headcount:', error);
      toast.error('Failed to save headcount');
      throw error;
    }
  }, [fetchHeadcounts, onHeadcountChange, positionId]);

  const refreshSelectedHeadcount = useCallback(async (headcountId: string) => {
    const updatedHeadcounts = await fetchHeadcounts();
    return updatedHeadcounts.find(headcount => headcount.id === headcountId) ?? null;
  }, [fetchHeadcounts]);

  useEffect(() => {
    if (!positionId) {
      return;
    }

    fetchHeadcounts();
    fetchHeadcountTypeOptions();
    fetchCustomFieldDefinitions();
  }, [fetchCustomFieldDefinitions, fetchHeadcountTypeOptions, fetchHeadcounts, positionId]);

  useEffect(() => {
    fetchHeadcountSLA(headcounts);
  }, [fetchHeadcountSLA, headcounts]);

  return {
    customFieldDefinitions,
    deleteHeadcount,
    error,
    headcountSLA,
    headcountTypeOptions,
    headcounts,
    loading,
    refreshSelectedHeadcount,
    saveHeadcount,
  };
}
