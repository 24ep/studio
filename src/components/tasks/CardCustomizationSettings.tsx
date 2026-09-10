"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { TaskBoardPreferences } from '@/hooks/use-user-preferences';
import {
  CardCustomizationFooter,
  CardCustomizationScrollbarStyle,
  CardCustomizationTabs,
  CardWidthPanel,
  VisibleFieldsPanel,
} from './CardCustomizationSettingsParts';
import type { CardCustomizationTab, TaskBoardCardVisibilityKey } from './CardCustomizationSettingsConfig';
import {
  buildCardWidthPreferenceUpdate,
  isTaskBoardCardWidth,
} from './card-customization-settings-utils';
import { buildChangedTaskBoardPreferences } from './task-board-preference-utils';

interface CardCustomizationSettingsProps {
  preferences: TaskBoardPreferences;
  onUpdatePreferences: (updates: Partial<TaskBoardPreferences>) => void;
  onResetPreferences: () => void;
  isSaving?: boolean;
}

export function CardCustomizationSettings({
  preferences,
  onUpdatePreferences,
  onResetPreferences,
  isSaving = false,
}: CardCustomizationSettingsProps) {
  const [localPreferences, setLocalPreferences] = useState<TaskBoardPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<CardCustomizationTab>('width');

  useEffect(() => {
    if (!hasChanges) {
      setLocalPreferences(preferences);
    }
  }, [preferences, hasChanges]);

  const updateLocalPreferences = useCallback((updates: Partial<TaskBoardPreferences>) => {
    setLocalPreferences(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleFieldToggle = useCallback((fieldKey: TaskBoardCardVisibilityKey, enabled: boolean) => {
    updateLocalPreferences({ [fieldKey]: enabled });
  }, [updateLocalPreferences]);

  const handleCardWidthChange = useCallback((value: string) => {
    if (isTaskBoardCardWidth(value)) {
      updateLocalPreferences(buildCardWidthPreferenceUpdate(value));
    }
  }, [updateLocalPreferences]);

  const handleCustomWidthChange = useCallback((value: number[]) => {
    updateLocalPreferences({
      customCardWidth: value[0],
      cardWidth: 'custom',
    });
  }, [updateLocalPreferences]);

  const handleSave = useCallback(() => {
    const changes = buildChangedTaskBoardPreferences(localPreferences, preferences);

    if (Object.keys(changes).length > 0) {
      onUpdatePreferences(changes);
    }
    setHasChanges(false);
    toast.success('Card settings saved successfully');
  }, [localPreferences, onUpdatePreferences, preferences]);

  const handleReset = useCallback(() => {
    onResetPreferences();
    setHasChanges(false);
  }, [onResetPreferences]);

  return (
    <div className="flex flex-col h-full max-h-[650px]">
      <CardCustomizationScrollbarStyle />
      <CardCustomizationTabs
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
      />

      <div className="flex-1 min-h-0 overflow-y-auto pr-4 custom-scrollbar">
        <div className="space-y-4 pb-4">
          {activeTab === 'width' && (
            <CardWidthPanel
              onCardWidthChange={handleCardWidthChange}
              onCustomWidthChange={handleCustomWidthChange}
              preferences={localPreferences}
            />
          )}

          {activeTab === 'fields' && (
            <VisibleFieldsPanel
              onFieldToggle={handleFieldToggle}
              preferences={localPreferences}
            />
          )}
        </div>
      </div>

      <CardCustomizationFooter
        hasChanges={hasChanges}
        isSaving={isSaving}
        onReset={handleReset}
        onSave={handleSave}
      />
    </div>
  );
}
