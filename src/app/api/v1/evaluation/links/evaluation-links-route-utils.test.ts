import { describe, expect, it, vi } from 'vitest';

import {
  buildEvaluationLinksWhereInput,
  getEvaluationLinksErrorPayload,
  parseEvaluationLinksQueryParams,
  serializeEvaluationLinkItem,
  type EvaluationLinkItem,
} from './evaluation-links-route-utils';

describe('evaluation-links-route-utils', () => {
  it('parses query params and builds filters', () => {
    const query = parseEvaluationLinksQueryParams(new URLSearchParams({
      applicantId: 'applicant-1',
      limit: '250',
      offset: '12',
      q: ' Ada ',
      status: 'active',
    }));

    expect(query).toEqual({
      applicantId: 'applicant-1',
      limit: 100,
      offset: 12,
      q: 'Ada',
      status: 'active',
    });

    expect(buildEvaluationLinksWhereInput(query, new Date('2026-06-10T00:00:00.000Z'))).toMatchObject({
      applicantId: 'applicant-1',
      revokedAt: null,
      expiresAt: { gt: new Date('2026-06-10T00:00:00.000Z') },
      OR: expect.any(Array),
    });
  });

  it('serializes evaluation link rows with interview metadata', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://studio.example.test');

    expect(serializeEvaluationLinkItem({
      id: 'link-1',
      applicantId: 'applicant 1',
      token: 'token 1',
      expiresAt: new Date('2026-06-11T00:00:00.000Z'),
      revokedAt: null,
      requireLogin: true,
      createdAt: new Date('2026-06-10T00:00:00.000Z'),
      applicant: {
        id: 'applicant 1',
        name: 'Ada',
        email: 'ada@example.test',
        avatarUrl: null,
        customAttributes: {
          interviewDate: '2026-06-12',
          interviewLocation: 'Room A',
          interviewers: ['user-1'],
        },
        position: null,
      },
      createdBy: { id: 'user-1', name: 'Grace', email: 'grace@example.test' },
    } as unknown as EvaluationLinkItem)).toMatchObject({
      id: 'link-1',
      url: 'https://studio.example.test/applicants/applicant%201/evaluate?token=token%201',
      interviewDateTime: '2026-06-12',
      interviewLocation: 'Room A',
      interviewers: ['user-1'],
    });

    vi.unstubAllEnvs();
  });

  it('adds migration hints for relation errors', () => {
    expect(getEvaluationLinksErrorPayload(new Error('relation "ApplicantEvaluationLink" does not exist'))).toEqual({
      error: 'Internal Server Error',
      message: 'relation "ApplicantEvaluationLink" does not exist',
      hint: 'Database table missing. Run migrations.',
    });
  });
});
