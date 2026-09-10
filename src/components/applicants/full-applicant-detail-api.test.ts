import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createEmployeeFromApplicant,
  deleteFullApplicantDetailApplicant,
  fetchApplicantTransitions,
  updateApplicantTransitionNote,
  updateFullApplicantDetailApplicant,
} from './full-applicant-detail-api';

function response(body: unknown, ok = true, statusText = 'Error') {
  return {
    ok,
    statusText,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('full applicant detail API helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deletes applicants and surfaces server error messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'Cannot delete' }, false)));

    await expect(deleteFullApplicantDetailApplicant('applicant-1')).rejects.toThrow('Cannot delete');
  });

  it('preserves an existing employee link response without treating it as an error', async () => {
    const payload = {
      created: false,
      message: 'Applicant is already linked to this employee.',
      employee: { id: 'employee-1', employeeNumber: 'EMP-000001' },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(payload)));

    await expect(createEmployeeFromApplicant('applicant-1')).resolves.toEqual(payload);
  });

  it('updates applicant details with JSON payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ id: 'applicant-1' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateFullApplicantDetailApplicant('applicant-1', {
      name: 'Mila Chen',
      status: 'screening',
    })).resolves.toEqual({ id: 'applicant-1' });

    expect(fetchMock).toHaveBeenCalledWith('/api/applicants/applicant-1', expect.objectContaining({
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({ name: 'Mila Chen', status: 'screening' }),
    }));
  });

  it('uses fallback update error messages when response JSON is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      json: vi.fn().mockRejectedValue(new Error('not json')),
    }));

    await expect(updateFullApplicantDetailApplicant('applicant-1', {})).rejects.toThrow('Failed to update applicant: Unknown error');
  });

  it('updates transition notes and normalizes transition list responses', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ ok: true }))
      .mockResolvedValueOnce(response({ data: [{ id: 'transition-1' }] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateApplicantTransitionNote('transition-1', 'Updated')).resolves.toBe(true);
    await expect(fetchApplicantTransitions('applicant-1')).resolves.toEqual([{ id: 'transition-1' }]);

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/transitions/transition-1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ notes: 'Updated' }),
    }));
  });
});
