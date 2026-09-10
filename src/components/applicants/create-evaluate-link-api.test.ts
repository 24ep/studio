import { describe, expect, it, vi } from 'vitest';

import {
  addCreateEvaluateLinkInterviewers,
  createApplicantEvaluationLink,
  fetchCreateEvaluateLinkAvailableUsers,
  fetchCreateEvaluateLinkAzureRooms,
  fetchCreateEvaluateLinkEmailTemplate,
  fetchCreateEvaluateLinkPositionValidation,
  getDefaultCreateEvaluateLinkEmailTemplate,
  sendCreateEvaluateLinkInvitationEmails,
} from './create-evaluate-link-api';
import { DEFAULT_INTERVIEW_INVITATION_SUBJECT } from './create-evaluate-link-utils';

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('create evaluate link API helpers', () => {
  it('loads position validation from interviewer and evaluation endpoints', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/interviewers')) {
        return jsonResponse([{ id: 'i1', userId: 'u1', userName: 'Ada', userEmail: 'ada@example.test' }]);
      }

      return jsonResponse({ expertiseSkills: [{ id: 'skill-1' }] });
    }) as unknown as typeof fetch;

    await expect(fetchCreateEvaluateLinkPositionValidation('position-1', fetcher)).resolves.toEqual({
      hasInterviewers: true,
      hasSkills: true,
      interviewers: [{ id: 'i1', userId: 'u1', userName: 'Ada', userEmail: 'ada@example.test' }],
    });
    expect(fetcher).toHaveBeenCalledWith('/api/positions/position-1/interviewers', { credentials: 'include' });
    expect(fetcher).toHaveBeenCalledWith('/api/v1/positions/position-1/evaluation', { credentials: 'include' });
  });

  it('normalizes users, email templates, and rooms with safe fallbacks', async () => {
    await expect(fetchCreateEvaluateLinkAvailableUsers(async () => jsonResponse({ users: 'bad' }))).resolves.toEqual([]);

    await expect(fetchCreateEvaluateLinkEmailTemplate(async () => jsonResponse({
      settings: [{ key: 'emailTemplateInterviewInvitationSubject', value: 'Custom subject' }],
    }))).resolves.toMatchObject({ subject: 'Custom subject' });

    await expect(fetchCreateEvaluateLinkEmailTemplate(async () => new Response('', { status: 500 }))).resolves.toEqual(
      getDefaultCreateEvaluateLinkEmailTemplate()
    );

    await expect(fetchCreateEvaluateLinkAzureRooms(async () => jsonResponse({
      rooms: [{ id: 'r1', displayName: 'Room A', capacity: 8, building: 'HQ' }],
    }))).resolves.toEqual([{ id: 'r1', displayName: 'Room A', capacity: 8, building: 'HQ' }]);
    expect(getDefaultCreateEvaluateLinkEmailTemplate().subject).toBe(DEFAULT_INTERVIEW_INVITATION_SUBJECT);
  });

  it('adds interviewers and returns only successful additions', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return new Response(null, { status: body.userId === 'u1' ? 201 : 409 });
    }) as unknown as typeof fetch;

    await expect(addCreateEvaluateLinkInterviewers({
      positionId: 'position-1',
      userIds: ['u1', 'u2'],
      fetcher,
    })).resolves.toBe(1);
  });

  it('creates evaluation links and surfaces API errors', async () => {
    await expect(createApplicantEvaluationLink({
      applicantId: 'applicant-1',
      payload: { days: 7 },
      fetcher: async () => jsonResponse({ url: 'https://example.test/evaluate', expiresAt: '2026-06-01T00:00:00.000Z' }),
    })).resolves.toEqual({ url: 'https://example.test/evaluate', expiresAt: '2026-06-01T00:00:00.000Z' });

    await expect(createApplicantEvaluationLink({
      applicantId: 'applicant-1',
      payload: { days: 7 },
      fetcher: async () => jsonResponse({ message: 'Nope' }, { status: 400 }),
    })).rejects.toThrow('Nope');
  });

  it('counts sent invitation email results', async () => {
    await expect(sendCreateEvaluateLinkInvitationEmails({
      applicantId: 'applicant-1',
      payload: { interviewerIds: ['u1', 'u2'] },
      fetcher: async () => jsonResponse({ results: [{ id: 'u1' }, { id: 'u2' }] }),
    })).resolves.toEqual({ sentCount: 2 });

    await expect(sendCreateEvaluateLinkInvitationEmails({
      applicantId: 'applicant-1',
      payload: { interviewerIds: ['u1'] },
      fetcher: async () => new Response(null, { status: 500 }),
    })).resolves.toEqual({ sentCount: 0 });
  });
});
