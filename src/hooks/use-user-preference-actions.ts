import { useCallback, type Dispatch, type SetStateAction } from 'react';

import {
  resetAllUserPreferences,
  resetUserPreferenceModel,
} from './user-preferences-api';
import {
  defaultPreferences,
  type AccessibilityPreferences,
  type AppearancePreferences,
  type PositionsPreferences,
  type PreferenceModelType,
  type SidebarPreferences,
  type TaskBoardPreferences,
  type UserPreferences,
} from './user-preferences-defaults';

interface UseUserPreferenceActionsOptions {
  savePreferences: (modelType: PreferenceModelType, updates: unknown) => void;
  setPreferences: Dispatch<SetStateAction<UserPreferences>>;
  userId: string | undefined;
}

export function useUserPreferenceActions({
  savePreferences,
  setPreferences,
  userId,
}: UseUserPreferenceActionsOptions) {
  const updatePreferenceSection = useCallback(
    <K extends PreferenceModelType>(modelType: K, updates: Partial<UserPreferences[K]>) => {
      setPreferences(prev => ({
        ...prev,
        [modelType]: { ...prev[modelType], ...updates },
      }));
      savePreferences(modelType, updates);
    },
    [savePreferences, setPreferences]
  );

  const resetPreferenceSection = useCallback(
    async <K extends PreferenceModelType>(modelType: K) => {
      if (!userId || await resetUserPreferenceModel(modelType)) {
        setPreferences(prev => ({
          ...prev,
          [modelType]: defaultPreferences[modelType],
        }));
      }
    },
    [setPreferences, userId]
  );

  const updateTaskBoardPreferences = useCallback((updates: Partial<TaskBoardPreferences>) => {
    updatePreferenceSection('taskBoard', updates);
  }, [updatePreferenceSection]);

  const updatePositionsPreferences = useCallback((updates: Partial<PositionsPreferences>) => {
    updatePreferenceSection('positions', updates);
  }, [updatePreferenceSection]);

  const updateAppearancePreferences = useCallback((updates: Partial<AppearancePreferences>) => {
    updatePreferenceSection('appearance', updates);
  }, [updatePreferenceSection]);

  const updateSidebarPreferences = useCallback((updates: Partial<SidebarPreferences>) => {
    updatePreferenceSection('sidebar', updates);
  }, [updatePreferenceSection]);

  const updateAccessibilityPreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    updatePreferenceSection('accessibility', updates);
  }, [updatePreferenceSection]);

  const resetTaskBoardPreferences = useCallback(() => {
    return resetPreferenceSection('taskBoard');
  }, [resetPreferenceSection]);

  const resetPositionsPreferences = useCallback(() => {
    return resetPreferenceSection('positions');
  }, [resetPreferenceSection]);

  const resetAppearancePreferences = useCallback(() => {
    return resetPreferenceSection('appearance');
  }, [resetPreferenceSection]);

  const resetSidebarPreferences = useCallback(() => {
    return resetPreferenceSection('sidebar');
  }, [resetPreferenceSection]);

  const resetAccessibilityPreferences = useCallback(() => {
    return resetPreferenceSection('accessibility');
  }, [resetPreferenceSection]);

  const resetAllPreferences = useCallback(async () => {
    if (!userId || await resetAllUserPreferences()) {
      setPreferences(defaultPreferences);
    }
  }, [setPreferences, userId]);

  return {
    updateTaskBoardPreferences,
    updatePositionsPreferences,
    updateAppearancePreferences,
    updateSidebarPreferences,
    updateAccessibilityPreferences,
    resetTaskBoardPreferences,
    resetPositionsPreferences,
    resetAppearancePreferences,
    resetSidebarPreferences,
    resetAccessibilityPreferences,
    resetAllPreferences,
  };
}
