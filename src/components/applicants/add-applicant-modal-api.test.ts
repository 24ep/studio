import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApplicantFromForm } from './add-applicant-modal-api';
import type { AddApplicantFormValues } from './add-applicant-modal-form';

const statusId = '11111111-1111-4111-8111-111111111111';
const positionId = '33333333-3333-4333-8333-333333333333';

function response(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

const formValues: AddApplicantFormValues = {
  cv_language: 'en',
  personal_info: { firstname: 'Mila', lastname: 'Chen' },
  contact_info: { email: 'mila@example.com', phone: '123' },
  education: [],
  experience: [],
  skills: [],
  job_suitable: [],
  positionId,
  status: statusId,
  fitScore: 80,
  applicationDate: '2024-05-06',
};

describe('add applicant modal API helper', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts transformed form data to the applicant creation route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ applicant: { id: 'applicant-1' } }, true, 201));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createApplicantFromForm(formValues)).resolves.toEqual({ applicant: { id: 'applicant-1' } });

    expect(fetchMock).toHaveBeenCalledWith('/api/applicants', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toMatchObject({
      applicant_info: { status: statusId },
      job_applied: { jobId: positionId, fitScore: 0.8 },
    });
  });

  it('surfaces server creation errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'Email already exists' }, false, 409)));

    await expect(createApplicantFromForm(formValues)).rejects.toThrow('Email already exists');
  });
});
