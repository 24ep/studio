import type { Applicant } from '@/lib/types';

const APPLICANT_REALTIME_REFRESH_EVENT_TYPES = new Set([
  'Applicant_update',
  'position_update',
  'dashboard_update',
]);

export function shouldHandleApplicantRealtimeRefreshEvent(eventType: string) {
  return APPLICANT_REALTIME_REFRESH_EVENT_TYPES.has(eventType);
}

export function getDeletedApplicantId(data: unknown) {
  return (data as { applicantId?: unknown } | null | undefined)?.applicantId;
}

export function getApplicantUpdate(data: unknown): Applicant | null {
  return data && typeof data === 'object' && typeof (data as { id?: unknown }).id === 'string'
    ? data as Applicant
    : null;
}

export function getApplicantEventAction(data: unknown) {
  return (data as { action?: unknown } | null | undefined)?.action;
}

export function removeApplicantById(applicants: Applicant[] | unknown, applicantId: string) {
  return Array.isArray(applicants)
    ? applicants.filter((applicant) => applicant.id !== applicantId)
    : [];
}

export function replaceApplicantById(applicants: Applicant[] | unknown, updatedApplicant: Applicant) {
  return Array.isArray(applicants)
    ? applicants.map((applicant) => applicant.id === updatedApplicant.id ? updatedApplicant : applicant)
    : [];
}

export function shouldRunApplicantRealtimeRefresh({
  isLoading,
  mounted,
  sessionStatus,
  sessionUserId,
}: {
  isLoading: boolean;
  mounted: boolean;
  sessionStatus: string;
  sessionUserId?: string;
}) {
  return mounted && sessionStatus === 'authenticated' && Boolean(sessionUserId) && !isLoading;
}
