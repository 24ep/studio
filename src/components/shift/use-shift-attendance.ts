"use client";

import * as React from 'react';
import toast from 'react-hot-toast';

import type { ShiftApiResponse } from './shift-types';

export function useShiftAttendance(view: string, query: URLSearchParams) {
  const [response, setResponse] = React.useState<ShiftApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const queryString = query.toString();

  const load = React.useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const suffix = queryString ? `&${queryString}` : '';
      const result = await fetch(`/api/hr/shift-attendance?view=${encodeURIComponent(view)}${suffix}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const body = await result.json().catch(() => ({})) as ShiftApiResponse & { message?: string };
      if (!result.ok) throw new Error(body.message || 'Unable to load Shift & Attendance.');
      setResponse(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Shift & Attendance.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [queryString, view]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const listener = () => {
      if (navigator.onLine) void load(true);
    };
    window.addEventListener('online', listener);
    return () => window.removeEventListener('online', listener);
  }, [load]);

  const mutate = React.useCallback(async (
    body: Record<string, unknown>,
    successMessage: string,
    options?: { url?: string; method?: 'POST' | 'PUT' | 'PATCH'; skipRefresh?: boolean },
  ) => {
    setSaving(true);
    setError(null);
    try {
      const result = await fetch(options?.url || '/api/hr/shift-attendance', {
        method: options?.method || 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(body),
      });
      const payload = await result.json().catch(() => ({})) as { data?: unknown; message?: string };
      if (!result.ok) throw new Error(payload.message || 'The action could not be completed.');
      toast.success(successMessage);
      if (!options?.skipRefresh) await load(true);
      return payload.data;
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'The action could not be completed.';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  }, [load]);

  return {
    data: response?.data || null,
    capabilities: response?.capabilities || null,
    loading,
    refreshing,
    saving,
    error,
    reload: () => load(true),
    mutate,
  };
}
