import { readJsonOrFallback } from '../../lib/response-json';

export async function deleteMobileApplicant(applicantId: string) {
  const response = await fetch(`/api/applicants/${applicantId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to delete Applicant');
}

export async function changeMobileApplicantStatus({
  applicantId,
  newStatus,
  notes,
}: {
  applicantId: string;
  newStatus: string;
  notes?: string;
}) {
  const response = await fetch('/api/applicants/bulk-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'change_status',
      applicantIds: [applicantId],
      newStatus,
      notes,
    }),
  });

  if (!response.ok) throw new Error('Failed to update status');
}

export async function updateMobileApplicantStatus({
  applicantId,
  statusId,
  notes,
}: {
  applicantId: string;
  statusId: string;
  notes?: string;
}) {
  const response = await fetch('/api/applicants/bulk-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'change_status',
      applicantIds: [applicantId],
      newStatus: statusId,
      ...(notes ? { transitionNotes: notes } : {}),
    }),
  });

  if (!response.ok) {
    const data = await readJsonOrFallback<{ message?: string }>(response, {});
    throw new Error(data.message || 'Failed to update status');
  }
}

export async function assignMobileApplicantRecruiter(applicantId: string, recruiterId: string | null) {
  const response = await fetch(`/api/applicants/${applicantId}/assign-recruiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ recruiterId }),
  });

  if (!response.ok) throw new Error('Failed to assign recruiter');
}

export async function updateMobileApplicantPin(applicantId: string, isPinned: boolean) {
  const response = await fetch(`/api/applicants/${applicantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ isPinned }),
  });

  if (!response.ok) throw new Error('Failed to update pin status');
}

export async function reprocessMobileApplicant(applicantId: string) {
  const response = await fetch(`/api/applicants/${applicantId}/reprocess`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to reprocess');
}
