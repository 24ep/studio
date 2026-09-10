import { describe, expect, it } from 'vitest';
import {
  buildCalendarQrDataFromCreatedLink,
  buildCalendarQrDataFromEvaluationLink,
  canCreateCalendarEvaluationLink,
  createEmptyPositionValidation,
  getCalendarPositionConfigurationUrl,
  getCalendarPositionValidationIssues,
  hasEvaluationCriteriaSkills,
  normalizeEvaluationLinks,
  normalizeInterviewers,
  normalizeSearchApplicants,
  shouldShowCalendarPositionValidationWarning,
  shouldShowCalendarSchedulingOptions,
  toggleCalendarInterviewerSelection,
} from './calendar-page-utils';
import {
  getCalendarCreateLinkDurationDays,
  getDefaultCalendarCreateLinkExpireDate,
} from './calendar-create-link-date-utils';

describe('calendar-page-utils', () => {
  it('normalizes evaluation links and skips unusable rows', () => {
    const links = normalizeEvaluationLinks({
      data: [
        {
          applicant: { id: 'a1', name: 'Ada', email: 'ada@example.com', avatarUrl: 'avatar.png', position: { id: 'p1', title: 'Engineer' } },
          url: 'https://example.com/eval',
          expiresAt: '2026-01-01T00:00:00.000Z',
          revokedAt: null,
        },
        { applicant: { id: 'a2', name: 'Missing URL' } },
        { url: 'https://example.com/no-applicant' },
      ],
    });

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      id: 'a1',
      name: 'Ada',
      email: 'ada@example.com',
      evaluationLink: { url: 'https://example.com/eval' },
    });
  });

  it('normalizes search applicants from wrapped and direct arrays', () => {
    expect(normalizeSearchApplicants({
      data: [{ id: 'a1', name: 'Ada', position: { id: 'p1', title: 'Engineer' } }],
    })[0]).toMatchObject({
      id: 'a1',
      name: 'Ada',
      positionId: 'p1',
    });

    expect(normalizeSearchApplicants([{ id: 'a2' }])[0]).toMatchObject({
      id: 'a2',
      name: 'Unknown',
      email: null,
    });
  });

  it('normalizes interviewers and falls back to email for names', () => {
    expect(normalizeInterviewers([
      { id: 'u1', name: 'Interviewer One', email: 'one@example.com' },
      { id: 'u2', email: 'two@example.com' },
      { name: 'missing id' },
    ])).toEqual([
      { id: 'u1', name: 'Interviewer One', email: 'one@example.com' },
      { id: 'u2', name: 'two@example.com', email: 'two@example.com' },
    ]);
  });

  it('detects configured evaluation criteria skills', () => {
    expect(hasEvaluationCriteriaSkills({ personalityTraits: [] })).toBe(false);
    expect(hasEvaluationCriteriaSkills({ expertiseGroups: ['backend'] })).toBe(true);
    expect(hasEvaluationCriteriaSkills(null)).toBe(false);
  });

  it('creates an empty position validation state with overrides', () => {
    expect(createEmptyPositionValidation({ positionId: 'p1', error: 'Missing position' })).toMatchObject({
      hasInterviewers: false,
      hasSkills: false,
      positionId: 'p1',
      error: 'Missing position',
      isLoading: false,
    });
  });

  it('checks whether an evaluation link can be created', () => {
    const applicant = { id: 'a1', name: 'Ada', email: null, avatarUrl: null };
    const validPosition = createEmptyPositionValidation({
      hasInterviewers: true,
      hasSkills: true,
    });

    expect(canCreateCalendarEvaluationLink({
      selectedApplicant: applicant,
      positionValidation: validPosition,
      sendAppointment: false,
    })).toBe(true);

    expect(canCreateCalendarEvaluationLink({
      selectedApplicant: applicant,
      positionValidation: validPosition,
      sendAppointment: true,
      selectedInterviewerIds: new Set(['u1']),
    })).toBe(true);

    expect(canCreateCalendarEvaluationLink({
      selectedApplicant: applicant,
      positionValidation: validPosition,
      sendAppointment: true,
      selectedInterviewerIds: new Set(),
    })).toBe(false);

    expect(canCreateCalendarEvaluationLink({
      selectedApplicant: null,
      positionValidation: validPosition,
      sendAppointment: false,
    })).toBe(false);
  });

  it('shows calendar position validation warnings only after loading finishes', () => {
    const applicant = { id: 'a1', name: 'Ada', email: null, avatarUrl: null };

    expect(shouldShowCalendarPositionValidationWarning({
      selectedApplicant: applicant,
      positionValidation: createEmptyPositionValidation({ isLoading: true, error: 'Missing position' }),
    })).toBe(false);

    expect(shouldShowCalendarPositionValidationWarning({
      selectedApplicant: applicant,
      positionValidation: createEmptyPositionValidation({ hasInterviewers: true, hasSkills: true }),
    })).toBe(false);

    expect(shouldShowCalendarPositionValidationWarning({
      selectedApplicant: applicant,
      positionValidation: createEmptyPositionValidation({ hasInterviewers: true, hasSkills: false }),
    })).toBe(true);

    expect(shouldShowCalendarPositionValidationWarning({
      selectedApplicant: null,
      positionValidation: createEmptyPositionValidation({ error: 'Missing position' }),
    })).toBe(false);
  });

  it('derives scheduling visibility and validation issue messages', () => {
    const applicant = { id: 'a1', name: 'Ada', email: null, avatarUrl: null };

    expect(shouldShowCalendarSchedulingOptions({
      selectedApplicant: applicant,
      positionValidation: createEmptyPositionValidation({
        hasInterviewers: true,
        hasSkills: true,
      }),
    })).toBe(true);

    expect(shouldShowCalendarSchedulingOptions({
      selectedApplicant: applicant,
      positionValidation: createEmptyPositionValidation({
        hasInterviewers: true,
        hasSkills: true,
        isLoading: true,
      }),
    })).toBe(false);

    expect(getCalendarPositionValidationIssues(createEmptyPositionValidation())).toEqual([
      'No interviewers assigned to the position',
      'No evaluation skills assigned to the position (requires at least 1 personality or expertise skill)',
    ]);

    expect(getCalendarPositionValidationIssues(createEmptyPositionValidation({
      error: 'Failed to validate position configuration',
    }))).toEqual(['Failed to validate position configuration']);
  });

  it('builds position configuration urls and toggles interviewer selections immutably', () => {
    expect(getCalendarPositionConfigurationUrl('p1')).toBe('/positions/p1');
    expect(getCalendarPositionConfigurationUrl(null)).toBeNull();

    const originalSelection = new Set(['u1']);
    const withAddedInterviewer = toggleCalendarInterviewerSelection(originalSelection, 'u2', true);
    const withRemovedInterviewer = toggleCalendarInterviewerSelection(withAddedInterviewer, 'u1', false);

    expect(Array.from(originalSelection)).toEqual(['u1']);
    expect(Array.from(withAddedInterviewer).sort()).toEqual(['u1', 'u2']);
    expect(Array.from(withRemovedInterviewer)).toEqual(['u2']);
  });

  it('builds QR data from newly created and existing evaluation links', () => {
    const applicant = { id: 'a1', name: 'Ada', email: null, avatarUrl: 'avatar.png' };

    expect(buildCalendarQrDataFromCreatedLink(applicant, {
      url: 'https://example.com/evaluate',
      expiresAt: '2026-01-01T00:00:00.000Z',
    })).toEqual({
      name: 'Ada',
      url: 'https://example.com/evaluate',
      avatarUrl: 'avatar.png',
      expiresAt: '2026-01-01T00:00:00.000Z',
    });

    expect(buildCalendarQrDataFromCreatedLink(applicant, { url: null })).toBeNull();

    expect(buildCalendarQrDataFromEvaluationLink({
      id: 'a2',
      name: 'Grace',
      email: null,
      avatarUrl: null,
      evaluationLink: {
        url: 'https://example.com/grace',
        expiresAt: '2026-02-01T00:00:00.000Z',
      },
    })).toEqual({
      name: 'Grace',
      url: 'https://example.com/grace',
      avatarUrl: null,
      expiresAt: '2026-02-01T00:00:00.000Z',
    });
  });

  it('derives default create-link expiry and duration days', () => {
    expect(getDefaultCalendarCreateLinkExpireDate(new Date('2026-06-01T10:30:00.000Z'))).toBe('2026-06-08T10:30');
    expect(getCalendarCreateLinkDurationDays('2026-06-04T10:30', new Date('2026-06-01T10:30:00.000Z'))).toBe(3);
    expect(getCalendarCreateLinkDurationDays('bad-date')).toBe(7);
    expect(getCalendarCreateLinkDurationDays('2026-05-01T00:00', new Date('2026-06-01T00:00:00.000Z'))).toBe(1);
  });
});
