import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

import type { ApplicantSettings } from '@/components/applicants/applicant-settings-types';
import {
  APPLICANT_SETTINGS_MAX_RETRIES,
  DEFAULT_APPLICANT_SETTINGS_FOR_HOOK,
  getApplicantSettingsErrorMessage,
  getApplicantSettingsRetryDelay,
  isApplicantSettingsAbortError,
  loadApplicantSettingsFromApi,
  saveApplicantSettingsToApi,
} from './applicant-settings-api';

export function useApplicantSettings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<ApplicantSettings>(DEFAULT_APPLICANT_SETTINGS_FOR_HOOK);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (status === 'loading') {
      return;
    }

    if (status !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false);
      setSettings(DEFAULT_APPLICANT_SETTINGS_FOR_HOOK);
      return;
    }

    for (let retryCount = 1; retryCount <= APPLICANT_SETTINGS_MAX_RETRIES; retryCount++) {
      try {
        setIsLoading(true);
        setError(null);

        const result = await loadApplicantSettingsFromApi();
        if (!result.ok) {
          setError(result.error);
          break;
        }

        setSettings(result.settings);
        setIsLoading(false);
        return;
      } catch (err) {
        if (!isApplicantSettingsAbortError(err)) {
          console.error(`Error loading applicant settings (attempt ${retryCount}):`, err);
        }

        if (retryCount >= APPLICANT_SETTINGS_MAX_RETRIES) {
          if (isApplicantSettingsAbortError(err)) {
            console.warn('Applicant settings request timed out after 10 seconds');
            setError('Request timeout. Please try again.');
          } else {
            setError(getApplicantSettingsErrorMessage(err, 'Failed to load settings'));
          }

          setSettings(DEFAULT_APPLICANT_SETTINGS_FOR_HOOK);
          setIsLoading(false);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, getApplicantSettingsRetryDelay(retryCount)));
      }
    }

    setIsLoading(false);
  }, [session?.user?.id, status]);

  const saveSettings = useCallback(async (newSettings: ApplicantSettings) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveApplicantSettingsToApi(newSettings);
      setSettings(newSettings);
    } catch (err) {
      if (!isApplicantSettingsAbortError(err)) {
        console.error('Error saving applicant settings:', err);
      }

      if (isApplicantSettingsAbortError(err)) {
        console.warn('Applicant settings save request timed out after 10 seconds');
        setError('Request timeout. Please try again.');
      } else {
        setError(getApplicantSettingsErrorMessage(err, 'Failed to save settings'));
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);

  useEffect(() => {
    let isMounted = true;

    if (status !== 'loading') {
      loadSettings().catch((loadError: unknown) => {
        if (isMounted) {
          console.error('Error loading applicant settings:', loadError);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [loadSettings, status]);

  return {
    settings,
    setSettings: saveSettings,
    isLoading,
    error,
    reload: loadSettings,
    clearError: () => setError(null),
  };
}
