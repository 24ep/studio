"use client";

import * as React from 'react';
import toast from 'react-hot-toast';

import type { EssDashboard, EssView, TeamDashboard } from './ess-types';

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({})) as { message?: string };
  return body.message || fallback;
}

export function useEssData(view: EssView) {
  const [data, setData] = React.useState<EssDashboard | null>(null);
  const [team, setTeam] = React.useState<TeamDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [backgroundLoading, setBackgroundLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (background = false) => {
    background ? setBackgroundLoading(true) : setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ess/me', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(await readError(response, 'Unable to load employee self-service.'));
      const payload = await response.json() as { data: EssDashboard | null; message?: string };
      if (!payload.data) throw new Error(payload.message || 'No employee record is linked to this account.');
      setData(payload.data);
      if (view === 'team' && payload.data.metrics.directReports > 0) {
        const teamResponse = await fetch('/api/ess/team', { credentials: 'include', cache: 'no-store' });
        if (!teamResponse.ok) throw new Error(await readError(teamResponse, 'Unable to load manager self-service.'));
        const teamPayload = await teamResponse.json() as { data: TeamDashboard };
        setTeam(teamPayload.data);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load employee self-service.';
      setError(message);
      if (!background) setData(null);
    } finally {
      setLoading(false);
      setBackgroundLoading(false);
    }
  }, [view]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const mutate = React.useCallback(async (
    url: string,
    method: 'POST' | 'PATCH' | 'PUT',
    body: unknown,
    successMessage: string,
  ) => {
    if (submitting) return null;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await readError(response, 'Unable to complete this action.'));
      const payload = await response.json() as { data?: unknown };
      toast.success(successMessage);
      await load(true);
      return payload.data ?? true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to complete this action.';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [load, submitting]);

  const upload = React.useCallback(async (formData: FormData, successMessage: string) => {
    if (submitting) return false;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/ess/documents/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error(await readError(response, 'Unable to upload this document.'));
      toast.success(successMessage);
      await load(true);
      return true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to upload this document.';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [load, submitting]);

  return { data, team, loading, backgroundLoading, submitting, error, load, mutate, upload };
}
