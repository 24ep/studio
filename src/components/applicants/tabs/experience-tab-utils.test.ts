import { describe, expect, it } from 'vitest';

import {
  buildExperienceYearRange,
  createExperienceDefaults,
  getExperienceFitScoreValue,
  getExperienceTimelineDisplay,
  getParsedExperienceEntries,
  hasExperienceFitScore,
  isVisiblePositionLevel,
} from './experience-tab-utils';

describe('experience tab utilities', () => {
  it('builds form defaults and year ranges', () => {
    expect(buildExperienceYearRange(2026).slice(0, 3)).toEqual(['2026', '2025', '2024']);
    expect(buildExperienceYearRange(2026)).toHaveLength(50);

    expect(createExperienceDefaults()).toEqual({
      company: '',
      position: '',
      description: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      isCurrent: false,
      duration: '',
      positionLevel: '',
    });
  });

  it('reads parsed experience defensively', () => {
    const experience = [{ company: 'Acme' }];

    expect(getParsedExperienceEntries({ experience })).toBe(experience);
    expect(getParsedExperienceEntries({ experience: null })).toEqual([]);
    expect(getParsedExperienceEntries(null)).toEqual([]);
    expect(getParsedExperienceEntries({ education: [] })).toEqual([]);
  });

  it('formats experience timeline display through shared timeline helpers', () => {
    const now = new Date('2026-06-08T00:00:00.000Z');

    expect(getExperienceTimelineDisplay({
      startMonth: 2,
      startYear: 2020,
      endMonth: 8,
      endYear: 2021,
    }, now)).toEqual({
      startLabel: 'February 2020',
      endLabel: 'August 2021',
      duration: '1 year 6 months',
    });

    expect(getExperienceTimelineDisplay({
      startMonth: 6,
      startYear: 2025,
      isCurrent: true,
    }, now)).toEqual({
      startLabel: 'June 2025',
      endLabel: 'Present',
      duration: '1 year',
    });

    expect(getExperienceTimelineDisplay({ endMonth: 1, endYear: 2020 })).toBeNull();
  });

  it('detects fit scores and visible position levels', () => {
    expect(hasExperienceFitScore({ fitScore: 0 })).toBe(true);
    expect(hasExperienceFitScore({ fitScore: '82' })).toBe(true);
    expect(hasExperienceFitScore({ fitScore: null })).toBe(false);
    expect(hasExperienceFitScore({ fitScore: '' })).toBe(false);
    expect(getExperienceFitScoreValue({ fitScore: '82' })).toBe(82);
    expect(getExperienceFitScoreValue({ fitScore: 'not-a-score' })).toBeNull();

    expect(isVisiblePositionLevel('Senior')).toBe(true);
    expect(isVisiblePositionLevel('')).toBe(false);
    expect(isVisiblePositionLevel('   ')).toBe(false);
    expect(isVisiblePositionLevel('undefined')).toBe(false);
    expect(isVisiblePositionLevel(undefined)).toBe(false);
  });
});
