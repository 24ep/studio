import type { TransitionRecord } from '@/lib/types';
import { getJsonArray, getJsonErrorMessage, isJsonObject, readJsonObject, readJsonOrFallback } from '../../lib/response-json';

export interface CreatedEmployeeFromApplicant {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  status: string;
}

interface CreateEmployeeFromApplicantResponse {
  created?: boolean;
  message?: string;
  employee?: CreatedEmployeeFromApplicant;
  account?: {
    loginEmail: string;
    role: 'Employee';
    accountCreated: boolean;
    setupEmail?: { sent: boolean; error?: string };
  };
}

export async function deleteFullApplicantDetailApplicant(applicantId: string) {
  const response = await fetch(`/api/applicants/${applicantId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to delete Applicant'));
  }
}

export async function updateFullApplicantDetailApplicant(applicantId: string, payload: Record<string, unknown>) {
  const response = await fetch(`/api/applicants/${applicantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(response, { message: 'Unknown error' });
    throw new Error(`Failed to update applicant: ${errorData.message || response.statusText}`);
  }

  return readJsonOrFallback<unknown>(response, null);
}

export async function createEmployeeFromApplicant(applicantId: string) {
  const response = await fetch(`/api/applicants/${applicantId}/create-employee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await readJsonOrFallback<CreateEmployeeFromApplicantResponse>(response, {});

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create employee from applicant');
  }

  return data;
}

export async function updateApplicantTransitionNote(transitionId: string, note: string) {
  const response = await fetch(`/api/transitions/${transitionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: note }),
    credentials: 'include',
  });

  return response.ok;
}

export async function fetchApplicantTransitions(applicantId: string): Promise<TransitionRecord[]> {
  const response = await fetch(`/api/transitions?applicantId=${applicantId}`, {
    credentials: 'include',
  });

  if (!response.ok) return [];

  const data = await readJsonOrFallback<unknown>(response, []);
  const records = Array.isArray(data)
    ? data
    : getJsonArray(isJsonObject(data) ? data : {}, 'data') ?? [];

  return records.filter(isJsonObject).map((record) => record as unknown as TransitionRecord);
}
