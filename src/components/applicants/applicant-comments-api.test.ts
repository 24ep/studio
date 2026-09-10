import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchApplicantActivitiesPage,
  fetchApplicantCommentsPage,
  fetchApplicantReminders,
  getApplicantCommentMutationErrorMessage,
} from './applicant-comments-api';

function mockFetchJson(body: unknown, ok = true, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  }));
}

describe('applicant comments API helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes paginated comments responses', async () => {
    mockFetchJson({
      data: [{ id: 'comment-1' }],
      pagination: {
        hasMore: true,
        totalComments: 3,
        totalRemarks: 2,
      },
    });

    await expect(fetchApplicantCommentsPage({
      applicantId: 'applicant-1',
      limit: 5,
      offset: 0,
    })).resolves.toEqual({
      comments: [{ id: 'comment-1' }],
      hasMore: true,
      totalComments: 3,
      totalRemarks: 2,
    });
  });

  it('normalizes activity log pages and reminder responses', async () => {
    mockFetchJson({
      data: [{ id: 'activity-1' }],
      pagination: { hasMore: false, total: 7 },
    });

    await expect(fetchApplicantActivitiesPage({
      applicantId: 'applicant-1',
      limit: 5,
      offset: 5,
    })).resolves.toEqual({
      logs: [{ id: 'activity-1' }],
      hasMore: false,
      total: 7,
    });

    mockFetchJson({ data: 'bad-shape' });

    await expect(fetchApplicantReminders('applicant-1')).resolves.toEqual([]);
  });

  it('returns null for unsuccessful page fetches', async () => {
    mockFetchJson({ message: 'Nope' }, false, 500);

    await expect(fetchApplicantCommentsPage({
      applicantId: 'applicant-1',
      limit: 5,
      offset: 0,
    })).resolves.toBeNull();
  });

  it('prefers structured mutation error messages', () => {
    expect(getApplicantCommentMutationErrorMessage(400, '{"message":"File too large"}')).toBe('File too large');
    expect(getApplicantCommentMutationErrorMessage(400, '{"error":"Bad file"}')).toBe('Bad file');
    expect(getApplicantCommentMutationErrorMessage(500, '')).toBe('Failed to add comment: 500');
  });
});
