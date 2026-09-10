import type { Applicant } from '../../lib/types';

type ApplicantFlagFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Pick<Response, 'ok'>>;

export function getNextApplicantPinValue(applicant: Pick<Applicant, 'isPinned'>) {
  return !applicant.isPinned;
}

export function getNextApplicantReadValue(applicant: Pick<Applicant, 'isRead'>) {
  return applicant.isRead === false;
}

export function buildApplicantFlagUpdateRequest(body: Record<string, boolean>) {
  return {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function updateApplicantFlag(
  applicantId: string,
  body: Record<string, boolean>,
  errorMessage: string,
  fetcher: ApplicantFlagFetch = fetch
) {
  const response = await fetcher(
    `/api/applicants/${applicantId}`,
    buildApplicantFlagUpdateRequest(body)
  );

  if (!response.ok) {
    throw new Error(errorMessage);
  }
}

export async function toggleApplicantPinStatus(
  applicant: Applicant,
  onRefreshApplicantData: (applicantId: string) => Promise<void>,
  fetcher?: ApplicantFlagFetch
) {
  const nextIsPinned = getNextApplicantPinValue(applicant);
  await updateApplicantFlag(
    applicant.id,
    { isPinned: nextIsPinned },
    `Failed to ${applicant.isPinned ? 'unpin' : 'pin'} applicant`,
    fetcher
  );
  await onRefreshApplicantData(applicant.id);
}

export async function toggleApplicantReadStatus(
  applicant: Applicant,
  onRefreshApplicantData: (applicantId: string) => Promise<void>,
  fetcher?: ApplicantFlagFetch
) {
  const nextIsRead = getNextApplicantReadValue(applicant);
  await updateApplicantFlag(
    applicant.id,
    { isRead: nextIsRead },
    `Failed to mark applicant as ${applicant.isRead === false ? 'read' : 'unread'}`,
    fetcher
  );
  await onRefreshApplicantData(applicant.id);
}
