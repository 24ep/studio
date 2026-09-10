import { describe, expect, it, vi } from 'vitest';

import {
  getFitScoreCount,
  getFitScoreGradeBorderColor,
  getFitScoreGradeTextColor,
  getFitScoreTotalCount,
  getSafeFitScoreSelectedGrades,
  toggleFitScoreGrade,
} from './fit-score-filter-tabs-utils';

describe('fit score filter tab utilities', () => {
  it('normalizes selected grades and derives counts', () => {
    expect(getSafeFitScoreSelectedGrades().size).toBe(0);
    const selected = new Set(['A']);
    expect(getSafeFitScoreSelectedGrades(selected)).toBe(selected);

    const counts = [{ letter: 'A', count: 4 }, { letter: 'B', count: 2 }];
    expect(getFitScoreCount(counts, 'A')).toBe(4);
    expect(getFitScoreCount(counts, 'E')).toBe(0);
    expect(getFitScoreCount(undefined, 'A')).toBe(0);
  });

  it('uses AI matched total only when active and positive', () => {
    const counts = [{ letter: 'A', count: 4 }, { letter: 'B', count: 2 }];

    expect(getFitScoreTotalCount({ aiMatchedCount: 10, counts, isAiSearchActive: true })).toBe(10);
    expect(getFitScoreTotalCount({ aiMatchedCount: 0, counts, isAiSearchActive: true })).toBe(6);
    expect(getFitScoreTotalCount({ aiMatchedCount: 10, counts, isAiSearchActive: false })).toBe(6);
  });

  it('maps grade colors with defaults', () => {
    expect(getFitScoreGradeBorderColor('A')).toBe('bg-blue-800');
    expect(getFitScoreGradeBorderColor('no-score')).toBe('bg-gray-400');
    expect(getFitScoreGradeBorderColor('unknown')).toBe('bg-primary');
    expect(getFitScoreGradeTextColor('B')).toBe('text-blue-600');
    expect(getFitScoreGradeTextColor('unknown')).toBe('text-primary');
  });

  it('clears other selected grades in single-select mode before toggling target', () => {
    const onGradeToggle = vi.fn();

    toggleFitScoreGrade({
      filterMode: 'single',
      grade: 'B',
      onGradeToggle,
      selectedGrades: new Set(['A', 'B', 'C']),
    });

    expect(onGradeToggle).toHaveBeenCalledTimes(3);
    expect(onGradeToggle.mock.calls.map(([grade]) => grade)).toEqual(['A', 'C', 'B']);
  });
});
