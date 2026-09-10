import { describe, expect, it } from 'vitest';

import {
  buildWaitingEvaluationsMap,
  countCompletedWaitingInterviewers,
  getEvaluationWaitingProgressPercent,
  getEvaluationWaitingRemainingLabel,
  haveAllWaitingInterviewersCompleted,
  isWaitingEvaluationComplete,
} from './evaluation-waiting-utils';

describe('evaluation waiting utilities', () => {
  it('maps single and list payloads by evaluator id', () => {
    const first = { evaluator: { id: 'interviewer-1' }, status: 'completed' };
    const second = { evaluator: { id: 'interviewer-2' }, overallScore: 0 };

    const listMap = buildWaitingEvaluationsMap([
      first,
      { evaluator: { id: null }, status: 'ignored' },
      'ignored',
      second,
    ]);

    expect(listMap.get('interviewer-1')).toBe(first);
    expect(listMap.get('interviewer-2')).toBe(second);
    expect(listMap.size).toBe(2);

    expect(buildWaitingEvaluationsMap(second).get('interviewer-2')).toBe(second);
    expect(buildWaitingEvaluationsMap(null).size).toBe(0);
  });

  it('treats status, personality scores, expertise scores, and zero overall score as complete', () => {
    expect(isWaitingEvaluationComplete(null)).toBe(false);
    expect(isWaitingEvaluationComplete({ status: ' completed ' })).toBe(true);
    expect(isWaitingEvaluationComplete({ personalityScores: [{ traitId: 'trait-1' }] })).toBe(true);
    expect(isWaitingEvaluationComplete({ expertiseScores: [{ skillId: 'skill-1' }] })).toBe(true);
    expect(isWaitingEvaluationComplete({ overallScore: 0 })).toBe(true);
    expect(isWaitingEvaluationComplete({ status: 'in_progress', personalityScores: [] })).toBe(false);
  });

  it('counts completion across waiting interviewers', () => {
    const evaluations = buildWaitingEvaluationsMap([
      { evaluator: { id: 'interviewer-1' }, status: 'completed' },
      { evaluator: { id: 'interviewer-2' }, expertiseScores: [{ skillId: 'skill-1' }] },
    ]);

    expect(countCompletedWaitingInterviewers([
      { userId: 'interviewer-1' },
      { userId: 'interviewer-2' },
    ], evaluations)).toBe(2);
    expect(haveAllWaitingInterviewersCompleted([
      { userId: 'interviewer-1' },
      { userId: 'interviewer-2' },
    ], evaluations)).toBe(true);
    expect(haveAllWaitingInterviewersCompleted([
      { userId: 'interviewer-1' },
      { userId: 'missing' },
    ], evaluations)).toBe(false);
    expect(haveAllWaitingInterviewersCompleted([], evaluations)).toBe(false);
  });

  it('formats progress safely', () => {
    expect(getEvaluationWaitingProgressPercent(1, 4)).toBe(25);
    expect(getEvaluationWaitingProgressPercent(1, 0)).toBe(0);
    expect(getEvaluationWaitingProgressPercent(5, 4)).toBe(100);
    expect(getEvaluationWaitingRemainingLabel(2, 4)).toBe('2 interviewers remaining');
    expect(getEvaluationWaitingRemainingLabel(3, 4)).toBe('1 interviewer remaining');
    expect(getEvaluationWaitingRemainingLabel(4, 4)).toBe('All interviewers completed!');
  });
});
