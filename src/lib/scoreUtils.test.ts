import { describe, expect, it } from 'vitest';

import {
  formatScoreWithGrade,
  getScoreBgColor,
  getScoreColor,
  getScoreGrade,
  getScoreGradeInfo,
  getScoreRangesForChart,
  normalizeFitScore,
} from './scoreUtils';

describe('score utilities', () => {
  it('normalizes decimal and percentage scores for grades', () => {
    expect(getScoreGrade(0)).toBe('E');
    expect(getScoreGrade(20)).toBe('E');
    expect(getScoreGrade(21)).toBe('D');
    expect(getScoreGrade(0.82)).toBe('A');
    expect(getScoreGrade(80)).toBe('B');
    expect(getScoreGrade(101)).toBeNull();
    expect(getScoreGrade(Number.NaN)).toBeNull();
    expect(getScoreGrade(null)).toBeNull();
  });

  it('returns grade styling and formatted labels', () => {
    expect(getScoreGradeInfo(45)).toMatchObject({ letter: 'C', range: '41-60' });
    expect(getScoreColor(45)).toBe('text-black');
    expect(getScoreBgColor(45)).toBe('bg-yellow-200');
    expect(getScoreBgColor(null)).toBe('bg-gray-200');
    expect(formatScoreWithGrade(0.82)).toBe('82% (A)');
    expect(formatScoreWithGrade(250)).toBe('250%');
    expect(formatScoreWithGrade(Number.NaN)).toBe('N/A');
    expect(formatScoreWithGrade(null)).toBe('N/A');
  });

  it('builds chart ranges and clamps normalized fit scores', () => {
    expect(getScoreRangesForChart()[0]).toEqual({
      label: 'A (81-100)',
      min: 81,
      max: 100,
      letter: 'A',
    });
    expect(normalizeFitScore(0.55)).toBe(55);
    expect(normalizeFitScore(80.4)).toBe(80);
    expect(normalizeFitScore(250)).toBe(100);
    expect(normalizeFitScore(-5)).toBe(0);
    expect(normalizeFitScore(Number.NaN)).toBe(0);
    expect(normalizeFitScore(null)).toBe(0);
  });
});
