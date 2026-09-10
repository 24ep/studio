import { describe, expect, it } from 'vitest';

import {
  buildPersonalitySkillOverviewGroups,
  isPersonalitySkillSelected,
} from './personality-skills-overview-utils';
import type { EvaluationFormData, EvaluationQuestion, EvaluationSummary } from '../types';

function makeQuestion(overrides: Partial<EvaluationQuestion> = {}): EvaluationQuestion {
  return {
    id: overrides.id ?? overrides.traitId ?? 'trait-1',
    traitId: overrides.traitId ?? 'trait-1',
    traitName: overrides.traitName ?? 'Trait',
    groupName: overrides.groupName ?? 'Group',
    description: overrides.description ?? '',
    shortDescription: overrides.shortDescription ?? '',
    score: overrides.score ?? 0,
    notes: overrides.notes ?? '',
  };
}

function makeFormData(questions: EvaluationQuestion[]): EvaluationFormData {
  return {
    applicant: { id: 'applicant-1', name: 'Ada' } as EvaluationFormData['applicant'],
    questions,
    currentQuestionIndex: 0,
    overallScore: 0,
    comments: '',
  };
}

describe('personality skills overview utilities', () => {
  it('groups questions with saved scores and sorted group config', () => {
    const formData = makeFormData([
      makeQuestion({ traitId: 'trait-1', traitName: 'Curiosity', groupName: 'Growth' }),
      makeQuestion({ traitId: 'trait-2', traitName: 'Ownership', groupName: 'Core' }),
      makeQuestion({ traitId: 'trait-3', traitName: 'Fallback', groupName: '' }),
    ]);
    const existingEvaluation: EvaluationSummary = {
      personalityScores: [
        { traitId: 'trait-1', score: 4, notes: 'Strong' },
        { traitId: 'trait-2', score: 'bad score' },
        { traitId: null, score: 5 },
      ],
    };

    const groups = buildPersonalitySkillOverviewGroups({
      existingEvaluation,
      formData,
      personalityGroupsConfig: [
        { name: 'Growth', sortOrder: 2 },
        { name: 'Core', sortOrder: 1 },
      ],
    });

    expect(groups.map(([groupName]) => groupName)).toEqual(['Core', 'Growth', 'Other']);
    expect(groups[0][1][0]).toMatchObject({
      question: { traitId: 'trait-2' },
      score: 0,
      notes: '',
    });
    expect(groups[1][1][0]).toMatchObject({
      question: { traitId: 'trait-1' },
      score: 4,
      notes: 'Strong',
    });
  });

  it('detects selected traits from current question or URL trait id', () => {
    const questions = [
      makeQuestion({ traitId: 'trait-1' }),
      makeQuestion({ traitId: 'trait-2' }),
    ];

    expect(isPersonalitySkillSelected({
      currentQuestionIndex: 1,
      questions,
      traitId: 'trait-2',
      urlTraitId: null,
    })).toBe(true);

    expect(isPersonalitySkillSelected({
      currentQuestionIndex: 0,
      questions,
      traitId: 'trait-2',
      urlTraitId: 'trait-2',
    })).toBe(true);
  });
});
