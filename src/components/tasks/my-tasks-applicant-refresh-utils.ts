import { safeFetch } from '@/lib/safe-fetch';

import {
  haveTaskboardApplicantSnapshotsChanged,
  type TaskboardApplicant,
} from './my-tasks-page-utils';

export const MY_TASKS_APPLICANT_REFRESH_EVENT_TYPES = new Set([
  'Applicant_update',
  'position_update',
  'dashboard_update',
]);

export function shouldHandleMyTasksApplicantRefreshEvent(eventType: string) {
  return MY_TASKS_APPLICANT_REFRESH_EVENT_TYPES.has(eventType);
}

export function extractTaskboardApplicants(data: unknown): TaskboardApplicant[] {
  const applicants = Array.isArray(data) ? data : getRecord(data).data;
  return Array.isArray(applicants) ? applicants as TaskboardApplicant[] : [];
}

export async function fetchTaskboardApplicants(buildTaskboardApplicantParams: () => URLSearchParams) {
  const params = buildTaskboardApplicantParams();
  const result = await safeFetch(`/api/taskboard/applicants?${params.toString()}`, { timeoutMs: 6000 });

  return result.ok && result.data
    ? { ok: true as const, applicants: extractTaskboardApplicants(result.data) }
    : { ok: false as const, error: result.error || result.status };
}

export async function reloadTaskboardApplicants({
  buildTaskboardApplicantParams,
  resetOnFailure,
  setApplicants,
  setLoading,
}: {
  buildTaskboardApplicantParams: () => URLSearchParams;
  resetOnFailure: boolean;
  setApplicants: (value: TaskboardApplicant[]) => void;
  setLoading: (value: boolean) => void;
}) {
  setLoading(true);
  try {
    const result = await fetchTaskboardApplicants(buildTaskboardApplicantParams);
    if (result.ok) {
      setApplicants(result.applicants);
    } else {
      console.warn('Skipping failed endpoint /api/applicants:', result.error);
      if (resetOnFailure) {
        setApplicants([]);
      }
    }
  } catch (error) {
    console.error('Error fetching Applicants:', error);
  } finally {
    setLoading(false);
  }
}

export async function refreshTaskboardApplicantsIfChanged({
  applicants,
  buildTaskboardApplicantParams,
  setApplicants,
}: {
  applicants: TaskboardApplicant[];
  buildTaskboardApplicantParams: () => URLSearchParams;
  setApplicants: (value: TaskboardApplicant[]) => void;
}) {
  try {
    const result = await fetchTaskboardApplicants(buildTaskboardApplicantParams);
    if (!result.ok) {
      console.warn('Skipping failed endpoint /api/applicants (periodic):', result.error);
      return;
    }

    if (haveTaskboardApplicantSnapshotsChanged(applicants, result.applicants)) {
      setApplicants(result.applicants);
    }
  } catch (error) {
    console.error('[MyTasksPageClient] Error in periodic refresh:', error);
  }
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
