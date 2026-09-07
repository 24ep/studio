import { useCallback, useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from "react-hot-toast";
import { AZURE_AD_SSO_CONCEPTUAL_KEY } from './system-status-config';
import type { StatusItem } from './system-status-types';
import {
  buildSystemStatusItems,
  canCheckSystemStatus,
  updateSystemStatusItem,
} from './system-status-utils';
import { checkStorageBucketStatus } from './system-status-api';

export interface ProbeLatencySample {
  at: number;
  latencyMs: number;
  ok: boolean;
}

const PROBE_INTERVAL_MS = 15_000;
const MAX_PROBE_SAMPLES = 24;

export function useSystemStatusPage() {
  const [isClient, setIsClient] = useState(false);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [probeLatency, setProbeLatency] = useState<ProbeLatencySample[]>([]);
  const { data: session, status: sessionStatus } = useSession();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const updateStatusItem = useCallback((id: string, updates: Partial<StatusItem>) => {
    setStatuses((prev) => updateSystemStatusItem(prev, id, updates));
  }, []);

  const runLiveProbe = useCallback(async () => {
    const startedAt = performance.now();
    let ok = false;

    try {
      const response = await fetch('/api/health', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      ok = response.ok;
      await response.body?.cancel().catch(() => undefined);
    } catch {
      ok = false;
    }

    const latencyMs = Math.max(1, Math.round(performance.now() - startedAt));
    setProbeLatency((current) => [
      ...current.slice(-(MAX_PROBE_SAMPLES - 1)),
      { at: Date.now(), latencyMs, ok },
    ]);
  }, []);

  const handleCheckStorageBucket = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !canCheckSystemStatus(session?.user)) {
      toast.error('You must be an Admin or have SYSTEM_SETTINGS_VIEW permission to perform this check.');
      return;
    }

    updateStatusItem('storage_bucket_check', { isLoading: true, status: 'checking' });

    try {
      const result = await checkStorageBucketStatus();

      if (!result.ok) {
        if (result.isUnauthorized) {
          signIn(undefined, { callbackUrl: window.location.pathname });
          updateStatusItem('storage_bucket_check', { isLoading: false, status: 'error', message: 'Unauthorized to check bucket.' });
          return;
        }

        updateStatusItem('storage_bucket_check', { status: 'error', message: result.message, isLoading: false });
        toast.error(result.message || 'Could not verify bucket status.');
        return;
      }

      updateStatusItem('storage_bucket_check', {
        status: result.status,
        message: result.message,
        isLoading: false,
      });
      toast.success(result.message);
    } catch (error) {
      console.error('Error during storage bucket check:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateStatusItem('storage_bucket_check', { status: 'error', message: `API Error: ${errorMessage}`, isLoading: false });
      toast.error(`Could not connect to API: ${errorMessage}`);
    }
  }, [session, sessionStatus, updateStatusItem]);

  const handleToggleAzureAdSsoConceptual = useCallback(() => {
    const currentSetting = localStorage.getItem(AZURE_AD_SSO_CONCEPTUAL_KEY) === 'true';
    const nextSetting = !currentSetting;
    const nextStatus = nextSetting ? 'enabled' : 'disabled';

    localStorage.setItem(AZURE_AD_SSO_CONCEPTUAL_KEY, String(nextSetting));
    updateStatusItem('azure_ad_sso_conceptual', {
      status: nextStatus,
      message: `Conceptual SSO is currently ${nextStatus}. Actual SSO depends on server ENV VARS.`,
      actionLabel: nextSetting ? "Conceptually Disable SSO" : "Conceptually Enable SSO",
    });
    toast.success(`Azure AD SSO status set to ${nextStatus}.`);
  }, [updateStatusItem]);

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: window.location.pathname });
      return;
    }

    const conceptualSsoEnabled = localStorage.getItem(AZURE_AD_SSO_CONCEPTUAL_KEY) === 'true';
    setStatuses(buildSystemStatusItems(conceptualSsoEnabled));
  }, [sessionStatus, currentPath]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    void runLiveProbe();
    const interval = window.setInterval(() => {
      void runLiveProbe();
    }, PROBE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [runLiveProbe, sessionStatus]);

  useEffect(() => {
    setStatuses((prev) => prev.map((item) => {
      if (item.id === 'storage_bucket_check') {
        return { ...item, action: handleCheckStorageBucket };
      }

      if (item.id === 'azure_ad_sso_conceptual') {
        return { ...item, action: handleToggleAzureAdSsoConceptual };
      }

      return item;
    }));
  }, [handleCheckStorageBucket, handleToggleAzureAdSsoConceptual]);

  const isLoading = sessionStatus === 'loading'
    || (sessionStatus === 'unauthenticated' && currentPath !== '/auth/signin' && !currentPath.startsWith('/_next/'))
    || !isClient;

  return {
    canCheckStorageBucket: canCheckSystemStatus(session?.user),
    isLoading,
    probeLatency,
    statuses,
  };
}

export type SystemStatusPageModel = ReturnType<typeof useSystemStatusPage>;
