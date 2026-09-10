import { readJsonObject } from '../../../lib/response-json';

interface JobAppliedUpdateOptions {
  applicantId: string;
}

async function requestJobAppliedUpdate(
  url: string,
  body: Record<string, unknown>,
  fallbackMessage: string,
  method = 'PUT'
) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    throw new Error(typeof errorData.message === 'string' ? errorData.message : fallbackMessage);
  }
}

export function updateJobAppliedStatus({
  applicantId,
  status,
}: JobAppliedUpdateOptions & { status: string }) {
  return requestJobAppliedUpdate(
    `/api/applicants/${applicantId}`,
    { status },
    'Failed to update status'
  );
}

export function updateJobAppliedRecruiter({
  applicantId,
  recruiterId,
}: JobAppliedUpdateOptions & { recruiterId: string | null }) {
  return requestJobAppliedUpdate(
    `/api/applicants/${applicantId}/assign-recruiter`,
    { recruiterId },
    'Failed to update recruiter',
    'POST'
  );
}

export function updateJobAppliedSource({
  applicantId,
  sourceId,
}: JobAppliedUpdateOptions & { sourceId: string | null }) {
  return requestJobAppliedUpdate(
    `/api/applicants/${applicantId}`,
    { sourceId },
    'Failed to update source'
  );
}

export function updateJobAppliedSalary({
  applicantId,
  expectedSalary,
}: JobAppliedUpdateOptions & { expectedSalary: number | null }) {
  return requestJobAppliedUpdate(
    `/api/applicants/${applicantId}`,
    { expectedSalary },
    'Failed to update salary'
  );
}
