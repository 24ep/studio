import { describe, expect, it } from 'vitest';

import {
  buildAveragedEvaluationData,
  buildAveragedEvaluationDataFromSingleEvaluation,
  buildEvaluateResultPrintGroupIds,
  canEditEvaluateResultApplicantBasic,
  getEvaluateResultHeaderBackgroundStyle,
  groupExpertiseSkills,
  groupPersonalityTraits,
  normalizeEvaluateResultHeaderSettings,
  normalizeEvaluateResultSettingsPayload,
} from './utils';

describe('evaluate result utilities', () => {
  it('averages scores across multiple evaluator records', () => {
    const evaluations = [
      {
        id: 'evaluation-1',
        evaluator: { id: 'evaluator-1', name: 'Ada' },
        overallScore: 80,
        personalityScores: [
          { trait: { id: 'trait-1', name: 'Ownership' }, score: 4 },
        ],
        expertiseScores: [
          { skill: { id: 'skill-1', name: 'React', maxScore: 10 }, score: 8 },
        ],
      },
      {
        id: 'evaluation-2',
        evaluator: { id: 'evaluator-2', name: 'Grace' },
        overallScore: 90,
        personalityScores: [
          { trait: { id: 'trait-1', name: 'Ownership' }, score: 2 },
        ],
        expertiseScores: [
          { skill: { id: 'skill-1', name: 'React', maxScore: 10 }, score: 10 },
        ],
      },
    ];

    expect(buildAveragedEvaluationData(evaluations)).toMatchObject({
      overallScore: 85,
      evaluatorCount: 2,
      personalityScores: [
        {
          trait: { id: 'trait-1', name: 'Ownership' },
          averageScore: 3,
          evaluatorCount: 2,
        },
      ],
      expertiseScores: [
        {
          skill: { id: 'skill-1', name: 'React', maxScore: 10 },
          averageScore: 9,
          evaluatorCount: 2,
        },
      ],
    });
  });

  it('returns null for empty averaged evaluation inputs', () => {
    expect(buildAveragedEvaluationData([])).toBeNull();
    expect(buildAveragedEvaluationData(null)).toBeNull();
  });

  it('builds averaged data from a single evaluation fallback payload', () => {
    expect(buildAveragedEvaluationDataFromSingleEvaluation({
      overallScore: 72,
      personalityScores: [{ trait: { id: 'trait-1' }, score: 5 }],
      expertiseScores: [{ skill: { id: 'skill-1' }, score: 7 }],
    })).toMatchObject({
      overallScore: 72,
      evaluatorCount: 1,
      personalityScores: [{ trait: { id: 'trait-1' }, averageScore: 5, evaluatorCount: 1 }],
      expertiseScores: [{ skill: { id: 'skill-1' }, averageScore: 7, evaluatorCount: 1 }],
    });

    expect(buildAveragedEvaluationDataFromSingleEvaluation(null)).toBeNull();
  });

  it('normalizes evaluate result settings from array and object API shapes', () => {
    expect(normalizeEvaluateResultSettingsPayload({
      settings: [
        { key: 'organizationName', value: 'Acme' },
        { key: 'appLogoDataUrl', value: '/logo.png' },
        { value: 'ignored' },
      ],
    })).toEqual({
      organizationName: 'Acme',
      appLogoDataUrl: '/logo.png',
    });

    expect(normalizeEvaluateResultSettingsPayload({
      organizationName: 'Object Shape',
    })).toEqual({
      organizationName: 'Object Shape',
    });
  });

  it('normalizes report header settings with logo and gradient fallbacks', () => {
    expect(normalizeEvaluateResultHeaderSettings({
      settings: [
        { key: 'evaluatePlatformLogoDataUrl', value: '/platform.png' },
        { key: 'organizationName', value: 'Acme' },
        { key: 'evaluateHeaderBackgroundGradientStart', value: '1 2% 3%' },
        { key: 'evaluateHeaderBackgroundGradientEnd', value: '4 5% 6%' },
      ],
    })).toMatchObject({
      appLogoUrl: '/platform.png',
      organizationLogoUrl: '/platform.png',
      organizationName: 'Acme',
      evaluateHeaderBackgroundGradient: 'linear-gradient(135deg, hsl(1 2% 3%), hsl(4 5% 6%))',
      evaluateHeaderBackgroundColor: '220 25% 97%',
      evaluateHeaderTextColor: '0 0% 0%',
    });
  });

  it('builds report header background styles', () => {
    expect(getEvaluateResultHeaderBackgroundStyle({
      evaluateHeaderBackgroundType: 'image',
      evaluateHeaderBackgroundImage: '/header.png',
      evaluateHeaderBackgroundGradient: 'ignored',
      evaluateHeaderBackgroundColor: '1 2% 3%',
    })).toEqual({
      backgroundImage: 'url(/header.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    });

    expect(getEvaluateResultHeaderBackgroundStyle({
      evaluateHeaderBackgroundType: 'solid',
      evaluateHeaderBackgroundImage: null,
      evaluateHeaderBackgroundGradient: 'ignored',
      evaluateHeaderBackgroundColor: '1 2% 3%',
    })).toEqual({
      backgroundColor: 'hsl(1 2% 3%)',
    });
  });

  it('builds the full set of expandable group ids for printing', () => {
    const groupIds = buildEvaluateResultPrintGroupIds({
      overallScore: 0,
      evaluatorCount: 1,
      personalityScores: [
        {
          trait: {
            id: 'ownership',
            name: 'Ownership',
            group: { id: 'mindset', name: 'Mindset', color: '#F59E0B' },
          },
          averageScore: 4,
          evaluatorCount: 1,
        },
      ],
      expertiseScores: [
        {
          skill: {
            id: 'react',
            name: 'React',
            maxScore: 10,
            group: { id: 'frontend', name: 'Frontend', color: '#14B8A6' },
          },
          averageScore: 8,
          evaluatorCount: 1,
        },
      ],
    }, []);

    expect(Array.from(groupIds).sort()).toEqual(['frontend', 'mindset']);
  });

  it('checks applicant basic edit access with aliases', () => {
    expect(canEditEvaluateResultApplicantBasic(null)).toBe(false);
    expect(canEditEvaluateResultApplicantBasic({
      id: 'admin',
      role: 'Admin',
      modulePermissions: [],
    })).toBe(true);
    expect(canEditEvaluateResultApplicantBasic({
      id: 'recruiter',
      role: 'Recruiter',
      modulePermissions: ['applicantS_EDIT_BASIC_OWN'],
    })).toBe(true);
    expect(canEditEvaluateResultApplicantBasic({
      id: 'viewer',
      role: 'Recruiter',
      modulePermissions: ['APPLICANTS_VIEW'],
    })).toBe(false);
  });

  it('groups expertise skills by configured group order and calculates percentages', () => {
    const groups = groupExpertiseSkills({
      overallScore: 0,
      evaluatorCount: 1,
      personalityScores: [],
      expertiseScores: [
        {
          skill: {
            id: 'react',
            name: 'React',
            maxScore: 10,
            group: { id: 'frontend', name: 'Frontend', color: '#14B8A6' },
          },
          averageScore: 8,
          evaluatorCount: 2,
        },
        {
          skill: {
            id: 'sql',
            name: 'SQL',
            maxScore: 20,
            group: null,
          },
          averageScore: 10,
          evaluatorCount: 1,
        },
        {
          skill: {
            id: 'node',
            name: 'Node',
            maxScore: 10,
            group: { id: 'backend', name: 'Backend', color: '#6366F1' },
          },
          averageScore: 7,
          evaluatorCount: 2,
        },
      ],
    }, [
      { name: 'Backend', sortOrder: 1 },
      { name: 'Frontend', sortOrder: 2 },
    ]);

    expect(groups.map(group => group.groupName)).toEqual(['Backend', 'Frontend', 'No Group']);
    expect(groups[0].skills[0]).toMatchObject({
      id: 'node',
      score: 7,
      maxScore: 10,
      percentage: 70,
    });
    expect(groups[2]).toMatchObject({
      groupId: 'ungrouped',
      groupColor: '#6B7280',
      skills: [{ id: 'sql', percentage: 50 }],
    });
  });

  it('groups personality traits and converts 1-5 scores to percentages', () => {
    const groups = groupPersonalityTraits({
      overallScore: 0,
      evaluatorCount: 1,
      expertiseScores: [],
      personalityScores: [
        {
          trait: {
            id: 'ownership',
            name: 'Ownership',
            description: 'Takes responsibility',
            group: { id: 'mindset', name: 'Mindset', color: '#F59E0B' },
          },
          averageScore: 5,
          evaluatorCount: 2,
        },
        {
          trait: {
            id: 'clarity',
            name: 'Clarity',
            group: { id: 'communication', name: 'Communication', color: '#22C55E' },
          },
          averageScore: 3,
          evaluatorCount: 2,
        },
      ],
    }, [
      { name: 'Communication', sortOrder: 1 },
      { name: 'Mindset', sortOrder: 2 },
    ]);

    expect(groups.map(group => group.groupName)).toEqual(['Communication', 'Mindset']);
    expect(groups[0].traits[0]).toMatchObject({
      id: 'clarity',
      score: 3,
      percentage: 50,
    });
    expect(groups[1].traits[0]).toMatchObject({
      id: 'ownership',
      description: 'Takes responsibility',
      percentage: 100,
    });
  });
});
