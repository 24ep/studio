import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  updateJobAppliedRecruiter,
  updateJobAppliedSalary,
  updateJobAppliedSource,
  updateJobAppliedStatus,
} from './job-applied-tab-api';

function response(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('job applied tab API helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates status, recruiter, source, and salary with the expected endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await updateJobAppliedStatus({ applicantId: 'applicant-1', status: 'stage-1' });
    await updateJobAppliedRecruiter({ applicantId: 'applicant-1', recruiterId: null });
    await updateJobAppliedSource({ applicantId: 'applicant-1', sourceId: 'source-1' });
    await updateJobAppliedSalary({ applicantId: 'applicant-1', expectedSalary: 50000 });

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/applicants/applicant-1', expect.objectContaining({
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({ status: 'stage-1' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/applicants/applicant-1/assign-recruiter', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ recruiterId: null }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/applicants/applicant-1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ sourceId: 'source-1' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/applicants/applicant-1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ expectedSalary: 50000 }),
    }));
  });

  it('surfaces server messages and falls back to contextual failures', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ message: 'No permission' }, false, 403))
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('not json')),
      } as unknown as Response));

    await expect(updateJobAppliedStatus({ applicantId: 'applicant-1', status: 'stage-1' })).rejects.toThrow('No permission');
    await expect(updateJobAppliedSalary({ applicantId: 'applicant-1', expectedSalary: null })).rejects.toThrow('Failed to update salary');
  });
});
