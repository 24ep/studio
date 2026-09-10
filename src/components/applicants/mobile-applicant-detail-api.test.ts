import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  changeMobileApplicantStatus,
  loadMobileApplicantDetailData,
  updateMobileApplicantStatus,
} from './mobile-applicant-detail-api';

function response(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('mobile applicant detail API helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and normalizes detail data from the mobile detail endpoints', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ id: 'applicant-1', name: 'Ari' }))
      .mockResolvedValueOnce(response({ data: [{ id: 'position-1' }] }))
      .mockResolvedValueOnce(response([{ id: 'stage-1', name: 'Applied' }]))
      .mockResolvedValueOnce(response({ data: [{ id: 'recruiter-1', email: 'r@example.com' }] }))
      .mockResolvedValueOnce(response({ data: [{ id: 'source-1', name: 'LinkedIn' }] }))
      .mockResolvedValueOnce(response({ data: [{ id: 'comment-1' }] }))
      .mockResolvedValueOnce(response({ data: [{ id: 'attachment-1' }] }))
      .mockResolvedValueOnce(response({ data: [{ id: 'transition-1' }] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadMobileApplicantDetailData('applicant-1')).resolves.toMatchObject({
      applicant: { id: 'applicant-1', name: 'Ari' },
      positions: [{ id: 'position-1' }],
      stages: [{ id: 'stage-1', name: 'Applied' }],
      recruiters: [{ id: 'recruiter-1', name: 'r@example.com' }],
      sources: [{ id: 'source-1', name: 'LinkedIn' }],
      comments: [{ id: 'comment-1' }],
      attachments: [{ id: 'attachment-1' }],
      transitions: [{ id: 'transition-1' }],
    });
  });

  it('rejects when the applicant endpoint does not return an applicant', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ message: 'Missing' }, false))
      .mockResolvedValue(response({ data: [] })));

    await expect(loadMobileApplicantDetailData('missing')).rejects.toThrow('Applicant not found');
  });

  it('sends mobile status changes with the expected payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await changeMobileApplicantStatus({
      applicantId: 'applicant-1',
      newStatus: 'stage-2',
      notes: 'Ready',
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      action: 'change_status',
      applicantIds: ['applicant-1'],
      newStatus: 'stage-2',
      notes: 'Ready',
    });
  });

  it('uses server-provided status update errors when available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'Headcount full' }, false)));

    await expect(updateMobileApplicantStatus({
      applicantId: 'applicant-1',
      statusId: 'hired',
    })).rejects.toThrow('Headcount full');
  });
});
