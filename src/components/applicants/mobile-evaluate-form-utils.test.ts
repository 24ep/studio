import { describe, expect, it } from 'vitest';

import {
  MOBILE_EVALUATE_SCORE_OPTIONS,
  getMobileEvaluateAnimationClassName,
  getMobileEvaluateProgressLabel,
} from './mobile-evaluate-form-utils';

describe('mobile evaluate form utilities', () => {
  it('defines the five score options in display order', () => {
    expect(MOBILE_EVALUATE_SCORE_OPTIONS.map(option => option.value)).toEqual([1, 2, 3, 4, 5]);
    expect(MOBILE_EVALUATE_SCORE_OPTIONS[0].label).toBe('Unsatisfactory');
    expect(MOBILE_EVALUATE_SCORE_OPTIONS[4].label).toBe('Exceptional');
  });

  it('builds question and comments progress labels', () => {
    expect(getMobileEvaluateProgressLabel({
      currentQuestionIndex: 1,
      questionCount: 4,
      isCommentsView: false,
    })).toBe('Question 2 of 4');

    expect(getMobileEvaluateProgressLabel({
      currentQuestionIndex: 4,
      questionCount: 4,
      isCommentsView: true,
    })).toBe('Comments (5/5)');
  });

  it('returns animation classes for each state and direction', () => {
    expect(getMobileEvaluateAnimationClassName('idle', 'next')).toBe('opacity-100 translate-x-0');
    expect(getMobileEvaluateAnimationClassName('exiting', 'next')).toBe('opacity-0 -translate-x-8');
    expect(getMobileEvaluateAnimationClassName('exiting', 'prev')).toBe('opacity-0 translate-x-8');
    expect(getMobileEvaluateAnimationClassName('entering', 'next')).toBe('opacity-0 translate-x-8');
    expect(getMobileEvaluateAnimationClassName('entering', 'prev')).toBe('opacity-0 -translate-x-8');
  });
});
