import { describe, expect, it } from 'vitest';

import {
  buildEducationYearRange,
  calculateTotalEducationDuration,
  createEducationDefaults,
  formatEducationFitGrade,
  formatTimelineDuration,
  getEducationTimelineDisplay,
  getParsedEducationEntries,
  hasEducationFitScore,
  isCurrentEducation,
} from './education-tab-utils';

describe('education tab utilities', () => {
  it('builds stable form defaults and year ranges', () => {
    expect(buildEducationYearRange(2026).slice(0, 3)).toEqual(['2026', '2025', '2024']);
    expect(buildEducationYearRange(2026)).toHaveLength(50);

    expect(createEducationDefaults()).toEqual({
      university: '',
      major: '',
      field: '',
      campus: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      isCurrent: false,
      duration: '',
      GPA: '',
    });
  });

  it('reads parsed education defensively', () => {
    const education = [{ university: 'State' }];

    expect(getParsedEducationEntries({ education })).toBe(education);
    expect(getParsedEducationEntries({ education: null })).toEqual([]);
    expect(getParsedEducationEntries(null)).toEqual([]);
    expect(getParsedEducationEntries({ experience: [] })).toEqual([]);
  });

  it('formats timeline labels and durations', () => {
    const now = new Date('2026-06-08T00:00:00.000Z');

    expect(getEducationTimelineDisplay({
      startMonth: 1,
      startYear: 2020,
      endMonth: 6,
      endYear: 2022,
    }, now)).toEqual({
      startLabel: 'January 2020',
      endLabel: 'June 2022',
      duration: '2 years 5 months',
    });

    expect(getEducationTimelineDisplay({
      startMonth: 6,
      startYear: 2025,
      isCurrent: true,
    }, now)).toEqual({
      startLabel: 'June 2025',
      endLabel: 'Present',
      duration: '1 year',
    });

    expect(getEducationTimelineDisplay({ startMonth: 1 })).toBeNull();
    expect(formatTimelineDuration('', '', 1, 2020, false, now)).toBe('');
  });

  it('calculates total education duration from valid ranges', () => {
    const now = new Date('2026-06-08T00:00:00.000Z');

    expect(calculateTotalEducationDuration([
      { startMonth: 1, startYear: 2020, endMonth: 1, endYear: 2021 },
      { startMonth: 6, startYear: 2025, isCurrent: true },
      { startMonth: 1 },
    ], now)).toBe('2 years');

    expect(calculateTotalEducationDuration([], now)).toBe('');
    expect(calculateTotalEducationDuration(null as unknown as Parameters<typeof calculateTotalEducationDuration>[0], now)).toBe('');
  });

  it('detects current education and formats fit grade thresholds', () => {
    expect(isCurrentEducation({ endMonth: '', endYear: '' })).toBe(true);
    expect(isCurrentEducation({ endMonth: 5, endYear: 2024 })).toBe(false);

    expect(hasEducationFitScore({ fitScore: 0 })).toBe(true);
    expect(hasEducationFitScore({ fitScore: '90' })).toBe(true);
    expect(hasEducationFitScore({ fitScore: null })).toBe(false);

    expect(formatEducationFitGrade(90)).toBe('A+');
    expect(formatEducationFitGrade(85)).toBe('A');
    expect(formatEducationFitGrade(80)).toBe('A-');
    expect(formatEducationFitGrade(75)).toBe('B+');
    expect(formatEducationFitGrade(70)).toBe('B');
    expect(formatEducationFitGrade(65)).toBe('B-');
    expect(formatEducationFitGrade(60)).toBe('C+');
    expect(formatEducationFitGrade(55)).toBe('C');
    expect(formatEducationFitGrade(50)).toBe('C-');
    expect(formatEducationFitGrade(49)).toBe('D');
    expect(formatEducationFitGrade('not-a-score')).toBe('');
  });
});
