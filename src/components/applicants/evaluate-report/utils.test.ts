import { describe, expect, it } from 'vitest';

import {
  buildAveragedEvaluationData,
  buildSingleEvaluationAverage,
  canEditEvaluateReportApplicantBasic,
  getEvaluationCompletionSummary,
  getExpandedReportGroupIds,
  normalizeEvaluationGroupConfigs,
  normalizeEvaluationRecords,
  normalizeInterviewers,
  normalizeReportHeaderPreferences,
} from './utils';

const trait = {
  id: 'trait-1',
  name: 'Ownership',
  group: { id: 'personality', name: 'Personality', color: '#111111' },
};

const skill = {
  id: 'skill-1',
  name: 'React',
  maxScore: 10,
  group: { id: 'expertise', name: 'Expertise', color: '#222222' },
};

describe('evaluate report utilities', () => {
  it('builds averaged evaluation data across multiple evaluators', () => {
    const averaged = buildAveragedEvaluationData([
      {
        evaluator: { id: 'user-1' },
        overallScore: 80,
        personalityScores: [{ trait, score: 4 }],
        expertiseScores: [{ skill, score: 8 }],
      },
      {
        evaluator: { id: 'user-2' },
        overallScore: 60,
        personalityScores: [{ trait, score: 2 }],
        expertiseScores: [{ skill, score: 6 }],
      },
    ]);

    expect(averaged).toMatchObject({
      overallScore: 70,
      evaluatorCount: 2,
      personalityScores: [{ trait, averageScore: 3, evaluatorCount: 2 }],
      expertiseScores: [{ skill, averageScore: 7, evaluatorCount: 2 }],
    });
  });

  it('returns null for empty multi-evaluation input', () => {
    expect(buildAveragedEvaluationData([])).toBeNull();
    expect(buildAveragedEvaluationData(null as unknown as Parameters<typeof buildAveragedEvaluationData>[0])).toBeNull();
  });

  it('builds a one-evaluator average from the fallback evaluation endpoint', () => {
    expect(buildSingleEvaluationAverage({
      overallScore: 75,
      status: 'completed',
      comments: 'Good',
      evaluator: { name: 'Jane', email: 'jane@example.com' },
      completedAt: '2026-01-01',
      personalityScores: [{ trait, score: 4 }],
      expertiseScores: [{ skill, score: 8 }],
    })).toMatchObject({
      overallScore: 75,
      evaluatorCount: 1,
      personalityScores: [{ trait, averageScore: 4, evaluatorCount: 1 }],
      expertiseScores: [{ skill, averageScore: 8, evaluatorCount: 1 }],
    });

    expect(buildSingleEvaluationAverage(null)).toBeNull();
  });

  it('summarizes interviewer completion from personality scores', () => {
    expect(getEvaluationCompletionSummary({
      interviewers: [],
      allEvaluations: [{ id: 'evaluation-1' }],
    })).toEqual({
      allEvaluationsComplete: true,
      completedCount: 1,
    });

    expect(getEvaluationCompletionSummary({
      interviewers: [{ userId: 'user-1' }, { userId: 'user-2' }],
      allEvaluations: [
        { evaluator: { id: 'user-1' }, personalityScores: [{ trait, score: 4 }] },
        { evaluator: { id: 'user-2' }, personalityScores: [] },
      ],
    })).toEqual({
      allEvaluationsComplete: false,
      completedCount: 1,
    });
  });

  it('derives report group ids for print expansion', () => {
    const ids = getExpandedReportGroupIds({
      averagedEvaluationData: {
        overallScore: 80,
        evaluatorCount: 1,
        personalityScores: [{ trait, averageScore: 4, evaluatorCount: 1 }],
        expertiseScores: [{ skill, averageScore: 8, evaluatorCount: 1 }],
      },
      personalityGroupsConfig: [],
    });

    expect(Array.from(ids).sort()).toEqual(['expertise', 'personality']);
  });

  it('normalizes header preferences from settings API shapes', () => {
    expect(normalizeReportHeaderPreferences({
      settings: [
        { key: 'evaluateReportLogoDataUrl', value: 'report-logo' },
        { key: 'organizationLogoDataUrl', value: 'org-logo' },
        { key: 'organizationName', value: 'Acme' },
      ],
    })).toMatchObject({
      appLogoUrl: 'report-logo',
      organizationLogoUrl: 'org-logo',
      organizationName: 'Acme',
      organizationAddress: null,
      organizationContact: null,
    });

    expect(normalizeReportHeaderPreferences({ appLogoDataUrl: 'app-logo' })).toMatchObject({
      appLogoUrl: 'app-logo',
      organizationLogoUrl: 'app-logo',
    });
  });

  it('normalizes report API payload lists defensively', () => {
    expect(normalizeEvaluationRecords([{ id: 'eval-1' }, null, 'bad'])).toEqual([{ id: 'eval-1' }]);
    expect(normalizeEvaluationRecords({ id: 'eval-1' })).toEqual([]);

    expect(normalizeInterviewers([{ userId: 'user-1' }, { userId: 2 }, null])).toEqual([
      { userId: 'user-1' },
    ]);

    expect(normalizeEvaluationGroupConfigs({
      groups: [
        { name: 'Culture', sortOrder: 2 },
        { name: 'Skills', sortOrder: 1 },
        { name: 'Other' },
        { missing: 'name' },
      ],
    })).toEqual([
      { name: 'Other', sortOrder: null },
      { name: 'Skills', sortOrder: 1 },
      { name: 'Culture', sortOrder: 2 },
    ]);
  });

  it('checks applicant basic edit permissions for report avatar changes', () => {
    expect(canEditEvaluateReportApplicantBasic(null)).toBe(false);
    expect(canEditEvaluateReportApplicantBasic({ role: 'Admin' })).toBe(true);
    expect(canEditEvaluateReportApplicantBasic({
      role: 'Recruiter',
      modulePermissions: ['applicantS_EDIT_BASIC_OWN'],
    })).toBe(true);
    expect(canEditEvaluateReportApplicantBasic({
      role: 'Recruiter',
      modulePermissions: ['other'],
    })).toBe(false);
  });
});
