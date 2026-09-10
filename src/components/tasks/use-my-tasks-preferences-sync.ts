import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { TaskBoardPreferences } from '@/hooks/use-user-preferences';

type TaskBoardViewMode = 'kanban' | 'table';

interface UseMyTasksPreferencesSyncInput {
  isLoaded: boolean;
  preferences: TaskBoardPreferences;
  updateTaskBoardPreferences: (updates: Partial<TaskBoardPreferences>) => void;
}

export function useMyTasksPreferencesSync({
  isLoaded,
  preferences,
  updateTaskBoardPreferences,
}: UseMyTasksPreferencesSyncInput) {
  const viewModeInitializedRef = useRef(false);
  const preferenceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPreferencesRef = useRef<{ viewMode: TaskBoardViewMode; selectedStages: string[] }>({
    viewMode: 'kanban',
    selectedStages: [],
  });

  const [viewMode, setViewMode] = useState<TaskBoardViewMode>('kanban');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  const memoizedPreferences = useMemo(() => preferences, [
    preferences.cardWidth,
    preferences.customCardWidth,
    preferences.showAvatar,
    preferences.showName,
    preferences.showEmail,
    preferences.showFitScore,
    preferences.showAssignee,
    preferences.showSkills,
    preferences.showJobApplied,
    preferences.searchTerm,
    preferences.filterPriority,
    preferences.filterAssignee,
    preferences.selectedStages,
    preferences.viewMode,
  ]);

  useEffect(() => {
    if (isLoaded && !viewModeInitializedRef.current) {
      viewModeInitializedRef.current = true;

      setViewMode(memoizedPreferences.viewMode);
      setSelectedStages(memoizedPreferences.selectedStages);
      lastSavedPreferencesRef.current = {
        viewMode: memoizedPreferences.viewMode,
        selectedStages: memoizedPreferences.selectedStages,
      };
    }
  }, [isLoaded, memoizedPreferences.viewMode, memoizedPreferences.selectedStages]);

  useEffect(() => {
    if (!isLoaded || !viewModeInitializedRef.current) {
      return;
    }

    const currentPreferences = {
      viewMode,
      selectedStages: JSON.stringify(selectedStages),
    };
    const lastSaved = {
      viewMode: lastSavedPreferencesRef.current.viewMode,
      selectedStages: JSON.stringify(lastSavedPreferencesRef.current.selectedStages),
    };

    if (
      currentPreferences.viewMode === lastSaved.viewMode &&
      currentPreferences.selectedStages === lastSaved.selectedStages
    ) {
      return;
    }

    if (preferenceUpdateTimeoutRef.current) {
      clearTimeout(preferenceUpdateTimeoutRef.current);
    }

    preferenceUpdateTimeoutRef.current = setTimeout(() => {
      updateTaskBoardPreferences({
        viewMode,
        selectedStages,
      });
      lastSavedPreferencesRef.current = {
        viewMode,
        selectedStages: [...selectedStages],
      };
    }, 300);
  }, [viewMode, selectedStages, isLoaded, updateTaskBoardPreferences]);

  useEffect(() => {
    return () => {
      if (preferenceUpdateTimeoutRef.current) {
        clearTimeout(preferenceUpdateTimeoutRef.current);
      }
    };
  }, []);

  const handleViewModeChange = useCallback((newViewMode: string) => {
    if (!isLoaded || !viewModeInitializedRef.current) {
      return;
    }

    if (newViewMode !== 'kanban' && newViewMode !== 'table') {
      return;
    }

    setViewMode(newViewMode);
  }, [isLoaded]);

  return {
    memoizedPreferences,
    selectedStages,
    setSelectedStages,
    viewMode,
    handleViewModeChange,
  };
}
