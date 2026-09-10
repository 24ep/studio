import { describe, expect, it } from 'vitest';
import {
  getApplicantLogsAuthFailureResponse,
  isValidApplicantLogsApplicantId,
} from './applicant-logs-request-utils';

async function readResponse(response: Response | null) {
  return response
    ? { status: response.status, body: JSON.parse(await response.text()) as { message?: string } }
    : null;
}

describe('applicant-logs-request-utils', () => {
  it('validates applicant ids', () => {
    expect(isValidApplicantLogsApplicantId('0f3ffbea-7147-4a32-a573-a6e0bcda5c3c')).toBe(true);
    expect(isValidApplicantLogsApplicantId('not-a-uuid')).toBe(false);
  });

  it('maps auth failures and allowed users', async () => {
    await expect(readResponse(getApplicantLogsAuthFailureResponse(null))).resolves.toEqual({
      status: 401,
      body: { message: 'Unauthorized' },
    });

    await expect(readResponse(getApplicantLogsAuthFailureResponse({ role: 'User', modulePermissions: [] }))).resolves.toEqual({
      status: 403,
      body: { message: 'Forbidden: No permission to view activities' },
    });

    await expect(readResponse(getApplicantLogsAuthFailureResponse({ role: 'Admin', modulePermissions: [] }))).resolves.toBeNull();
    await expect(readResponse(getApplicantLogsAuthFailureResponse({
      role: 'User',
      modulePermissions: ['APPLICANTS_ACTIVITIES_VIEW'],
    }))).resolves.toBeNull();
  });
});
