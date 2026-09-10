import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { UserPreferences } from '@/hooks/use-user-preferences';
import { readJsonOrFallback } from '@/lib/response-json';

import type { ModalMode, UnifiedUserPreferenceUpdates } from './types';
import {
  buildUnifiedUserPreferencesEndpoint,
  mergeUnifiedUserPreferenceModel,
} from './unified-user-modal-utils';

interface UseUnifiedUserModalPreferencesOptions {
  isOpen: boolean;
  mode: ModalMode;
  sessionUserId?: string;
  targetUserId?: string;
}

export function useUnifiedUserModalPreferences({
  isOpen,
  mode,
  sessionUserId,
  targetUserId,
}: UseUnifiedUserModalPreferencesOptions) {
  const [sidebarShowAssigned, setSidebarShowAssigned] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isPrefsLoading, setIsPrefsLoading] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!isOpen || !targetUserId) return;
      setIsPrefsLoading(true);
      try {
        const endpoint = buildUnifiedUserPreferencesEndpoint({
          mode,
          targetUserId,
          sessionUserId,
        });

        const response = await fetch(endpoint, { credentials: 'include' });
        if (response.ok) {
          const data = await readJsonOrFallback<UserPreferences | null>(response, null);
          if (!data) return;
          setPreferences(data);
          if (data.sidebar) {
            setSidebarShowAssigned(Boolean(data.sidebar.showAssignedPositions));
          }
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      } finally {
        setIsPrefsLoading(false);
      }
    };

    loadPreferences();
  }, [isOpen, mode, sessionUserId, targetUserId]);

  const updatePreferenceInDB = useCallback(async (modelType: string, updates: UnifiedUserPreferenceUpdates) => {
    try {
      const endpoint = buildUnifiedUserPreferencesEndpoint({
        mode,
        targetUserId,
        sessionUserId,
      });

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ modelType, updates }),
      });

      setPreferences((previous) => mergeUnifiedUserPreferenceModel(previous, modelType, updates));
    } catch {
      toast.error('Failed to save preference');
    }
  }, [mode, sessionUserId, targetUserId]);

  const handleResetPreference = useCallback(async (modelType: string) => {
    try {
      const endpoint = buildUnifiedUserPreferencesEndpoint({
        mode,
        targetUserId,
        sessionUserId,
        modelType,
      });

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.promise(Promise.resolve(), {
          loading: 'Resetting...',
          success: 'Preferences reset to defaults',
          error: 'Failed to reset preferences',
        });

        const reloadResponse = await fetch(endpoint.split('?')[0], { credentials: 'include' });
        if (reloadResponse.ok) {
          setPreferences(await readJsonOrFallback<UserPreferences | null>(reloadResponse, null));
        }
      }
    } catch {
      toast.error('Error resetting preferences');
    }
  }, [mode, sessionUserId, targetUserId]);

  const saveSidebarPref = useCallback(async (checked: boolean) => {
    setSidebarShowAssigned(checked);
    await updatePreferenceInDB('sidebar', { showAssignedPositions: checked });
  }, [updatePreferenceInDB]);

  return {
    handleResetPreference,
    isPrefsLoading,
    preferences,
    saveSidebarPref,
    sidebarShowAssigned,
    updatePreferenceInDB,
  };
}
