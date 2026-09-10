"use client";

import { useEffect, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import type { ApplicantSettings } from './applicant-settings-types';
import {
  DEFAULT_APPLICANT_SETTINGS,
  getApplicantSettingsSaveErrorMessage,
  mergeApplicantSettings,
  reorderApplicantSettingsColumns,
} from './applicant-settings-drawer-utils';

interface UseApplicantSettingsDrawerControllerOptions {
  currentSettings?: ApplicantSettings;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: ApplicantSettings) => Promise<void>;
}

export function useApplicantSettingsDrawerController({
  currentSettings,
  onOpenChange,
  onSettingsChange,
}: UseApplicantSettingsDrawerControllerOptions) {
  const [localSettings, setLocalSettings] = useState<ApplicantSettings>(() => {
    return mergeApplicantSettings(currentSettings);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (currentSettings) {
      setLocalSettings(prev => mergeApplicantSettings(currentSettings, prev));
    }
  }, [currentSettings]);

  const handleSettingChange = (key: keyof ApplicantSettings, value: boolean | string | number) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    setLocalSettings(prev => ({
      ...prev,
      columnOrder: reorderApplicantSettingsColumns({
        columnOrder: prev.columnOrder,
        sourceIndex: result.source.index,
        destinationIndex: result.destination?.index,
      }),
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await onSettingsChange(localSettings);
      onOpenChange(false);
    } catch (error) {
      console.error('SETTINGS DRAWER: Error saving settings:', error);
      setSaveError(getApplicantSettingsSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalSettings(currentSettings || DEFAULT_APPLICANT_SETTINGS);
    setSaveError(null);
    onOpenChange(false);
  };

  const clearSaveError = () => {
    setSaveError(null);
  };

  return {
    localSettings,
    isSaving,
    saveError,
    setSaveError,
    handleSettingChange,
    handleDragEnd,
    handleSave,
    handleCancel,
    clearSaveError,
  };
}
