import type { AddApplicantFormValues } from './add-applicant-modal-form';
import { buildCreateApplicantRequest } from './add-applicant-modal-form';
import { getJsonErrorMessage, readJsonObject } from '../../lib/response-json';

interface CreateApplicantResponse {
  applicant?: unknown;
  message?: string;
}

export async function createApplicantFromForm(data: AddApplicantFormValues): Promise<CreateApplicantResponse> {
  const response = await fetch('/api/applicants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(buildCreateApplicantRequest(data)),
  });

  const result = await readJsonObject(response);
  if (!response.ok) {
    throw new Error(getJsonErrorMessage(result, `Failed to create applicant: ${response.status}`));
  }

  return result;
}
