import { describe, expect, it, vi } from 'vitest';

import {
  applyInterviewerSelection,
  refreshExistingEvaluationState,
  syncTestingResultsWithExistingEvaluation,
} from './use-existing-evaluation-state';
import type { EvaluationFormData, TestingResult } from './types';
import type { Applicant } from '@/lib/types';

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: overrides.id ?? 'applicant-1',
    name: overrides.name ?? 'Ada',
    email: overrides.email ?? 'ada@example.com',
    parsedData: overrides.parsedData ?? null,
    positionId: overrides.positionId ?? null,
    fitScore: overrides.fitScore ?? 0,
    statusId: overrides.statusId ?? 'screening',
    status: overrides.status ?? 'Screening',
    applicationDate: overrides.applicationDate ?? '2026-01-01T00:00:00.000Z',
    transitionHistory: overrides.transitionHistory ?? [],
    ...overrides,
  };
}

describe('existing evaluation state helpers', () => {
  it('syncs expertise scores into testing results and keeps the ref current', () => {
    const previousResults: TestingResult[] = [
      { id: 'skill-1', label: 'React', score: 0, maxScore: 100 },
    ];
    const testingResultsRef = { current: previousResults };
    const setTestingResults = vi.fn((updater) => updater(previousResults));

    syncTestingResultsWithExistingEvaluation({
      evaluation: {
        expertiseScores: [
          { skillId: 'skill-1', score: 82 },
        ],
      },
      setTestingResults,
      testingResultsRef,
    });

    expect(setTestingResults).toHaveBeenCalledTimes(1);
    expect(testingResultsRef.current).toEqual([
      { id: 'skill-1', label: 'React', score: 82, maxScore: 100 },
    ]);
  });

  it('applies refreshed evaluation maps, selected interviewer, remarks, and score sync', () => {
    const evaluation = { id: 'evaluation-1', evaluator: { id: 'user-1' } };
    const setAllEvaluations = vi.fn();
    const setExistingEvaluation = vi.fn();
    const setSelectedInterviewerId = vi.fn();
    const setRemarkText = vi.fn();
    const syncTestingResultsWithEvaluation = vi.fn();

    refreshExistingEvaluationState({
      evaluations: [evaluation],
      applicantData: { customAttributes: { interviewRemarks: 'Shared note' } },
      setAllEvaluations,
      setExistingEvaluation,
      setSelectedInterviewerId,
      setRemarkText,
      syncTestingResultsWithEvaluation,
    });

    expect(setAllEvaluations.mock.calls[0][0].get('user-1')).toBe(evaluation);
    expect(setExistingEvaluation).toHaveBeenCalledWith(evaluation);
    expect(setSelectedInterviewerId).toHaveBeenCalledWith('user-1');
    expect(setRemarkText).toHaveBeenCalledWith('Shared note');
    expect(syncTestingResultsWithEvaluation).toHaveBeenCalledWith(evaluation);
  });

  it('applies interviewer selection to evaluation, form data, remarks, and testing results', () => {
    const evaluation = {
      evaluator: { id: 'user-2' },
      personalityScores: [{ traitId: 'trait-1', score: 4, notes: 'Solid' }],
      comments: 'Selected comment',
      overallScore: 4,
    };
    const formData: EvaluationFormData = {
      applicant: makeApplicant({ id: 'applicant-1', name: 'Ada' }),
      questions: [
        {
          id: 'question-1',
          traitId: 'trait-1',
          traitName: 'Ownership',
          groupName: 'Core',
          description: '',
          score: 0,
          notes: '',
        },
      ],
      currentQuestionIndex: 0,
      overallScore: 0,
      comments: '',
    };
    const setFormData = vi.fn((updater) => updater(formData));
    const setSelectedInterviewerId = vi.fn();
    const setRemarkText = vi.fn();
    const setExistingEvaluation = vi.fn();
    const syncTestingResultsWithEvaluation = vi.fn();

    applyInterviewerSelection({
      interviewerId: 'user-2',
      evaluation,
      applicantData: { custom_attributes: { interviewRemarks: 'Shared legacy note' } },
      setSelectedInterviewerId,
      setRemarkText,
      setExistingEvaluation,
      setFormData,
      syncTestingResultsWithEvaluation,
    });

    expect(setSelectedInterviewerId).toHaveBeenCalledWith('user-2');
    expect(setRemarkText).toHaveBeenCalledWith('Shared legacy note');
    expect(setExistingEvaluation).toHaveBeenCalledWith(evaluation);
    expect(setFormData.mock.results[0].value).toMatchObject({
      overallScore: 4,
      comments: 'Selected comment',
      questions: [{ score: 4, notes: 'Solid' }],
    });
    expect(syncTestingResultsWithEvaluation).toHaveBeenCalledWith(evaluation);
  });
});
