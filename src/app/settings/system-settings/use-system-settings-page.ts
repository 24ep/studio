"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

import { fetchSystemSettings as fetchSystemSettingsApi, saveSystemSettings } from './system-settings-api';
import { isSystemSettingsTabId } from './system-settings-page-constants';
import { buildSystemSettingsSavePayload, parseSystemSettingsViewState } from './system-settings-page-model';
import { getAppConfigChangeDetail } from './system-settings-utils';
import { useSystemSettingsFormState } from './use-system-settings-form-state';

export function useSystemSettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/settings/system-settings';
  const isAdmin = session?.user?.role === 'Admin';
  const formState = useSystemSettingsFormState();
  const { applySystemSettingsViewState } = formState;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('organize');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const lastSavedPayloadRef = useRef<string | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const latestSaveRequestRef = useRef(0);
  const isMountedRef = useRef(true);
  const serializedSettings = JSON.stringify(buildSystemSettingsSavePayload(formState));

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    setIsEditorReady(true);
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (isSystemSettingsTabId(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, []);

  const fetchSystemSettings = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const settings = await fetchSystemSettingsApi();
      const parsedSettings = parseSystemSettingsViewState(settings);
      lastSavedPayloadRef.current = JSON.stringify(buildSystemSettingsSavePayload(parsedSettings));
      applySystemSettingsViewState(parsedSettings);
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [applySystemSettingsViewState]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: currentPath });
    } else if (sessionStatus === 'authenticated') {
      fetchSystemSettings();
    }
  }, [sessionStatus, currentPath, fetchSystemSettings]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'system-api-keys') {
      setActiveTab('security');
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (!isLoading && !fetchError) {
      const timer = setTimeout(() => {
        setIsEditorReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, fetchError]);

  useEffect(() => {
    if (
      isLoading ||
      fetchError ||
      !isEditorReady ||
      lastSavedPayloadRef.current === null ||
      serializedSettings === lastSavedPayloadRef.current
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const requestId = ++latestSaveRequestRef.current;
      const payload = JSON.parse(serializedSettings) as Array<{ key: string; value: string }>;
      const payloadSignature = serializedSettings;
      setIsSaving(true);

      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            await saveSystemSettings(payload);
            lastSavedPayloadRef.current = payloadSignature;
            publishAppConfigChange(payload);
          } catch (error) {
            toast.error(getSystemSettingsSaveToastMessage(error));
          } finally {
            if (isMountedRef.current && requestId === latestSaveRequestRef.current) {
              setIsSaving(false);
            }
          }
        });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    fetchError,
    isEditorReady,
    isLoading,
    serializedSettings,
  ]);

  return {
    ...formState,
    activeTab,
    fetchError,
    fetchSystemSettings,
    isAdmin,
    isEditorReady,
    isLoading,
    isSaving,
    sessionStatus,
    setActiveTab,
  };
}

function publishAppConfigChange(settingsToSave: Array<{ key: string; value: string }>) {
  const appConfigChange = getAppConfigChangeDetail(settingsToSave);

  if (appConfigChange.appName) {
    localStorage.setItem('appConfigAppName', appConfigChange.appName);
  }
  if (appConfigChange.logoUrl) {
    localStorage.setItem('appLogoDataUrl', appConfigChange.logoUrl);
  }
  if (appConfigChange.changed) {
    window.dispatchEvent(new CustomEvent('appConfigChanged', {
      detail: {
        appName: appConfigChange.appName,
        faviconDataUrl: appConfigChange.faviconDataUrl,
        logoUrl: appConfigChange.logoUrl,
      },
    }));
    window.dispatchEvent(new CustomEvent('faviconUpdated', {
      detail: {
        faviconDataUrl: appConfigChange.faviconDataUrl,
      },
    }));
  }

  // Runtime consumers such as right-click and screen-capture protection must refresh
  // after every successful system-settings save, even when no branding field changed.
  window.dispatchEvent(new CustomEvent('globalSettingsChanged'));
}

function getSystemSettingsSaveToastMessage(error: unknown) {
  if (error instanceof Error) {
    return error.name === 'AbortError' ? 'Request timed out. Please try again.' : error.message;
  }

  return 'An unexpected error occurred';
}
