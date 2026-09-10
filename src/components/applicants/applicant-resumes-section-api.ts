import { readJsonOrFallback } from '@/lib/response-json';

export async function setApplicantPrimaryResume(applicantId: string, attachmentId: string) {
  const response = await fetch(`/api/applicants/${applicantId}/resumes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attachmentId }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to set primary');
  }
}

export async function deleteApplicantAttachment(applicantId: string, attachmentId: string) {
  const response = await fetch(`/api/v1/applicants/${applicantId}/attachments`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attachmentId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string; error?: string }>(
      response,
      { message: 'Failed to delete attachment' }
    );
    throw new Error(errorData.message || errorData.error || 'Failed to delete attachment');
  }
}
