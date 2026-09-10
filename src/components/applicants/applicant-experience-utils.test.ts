import { describe, expect, it } from 'vitest';

import {
  calculateTotalExperienceDuration,
  formatExperienceEntryDuration,
  getExperiencePeriodDisplay,
  isCurrentExperience,
  sortExperienceByTimeline,
  sortExperienceByTimelineAscending,
} from './applicant-experience-utils';
import type { ExperienceEntry } from '@/lib/types';

const now = new Date('2026-06-09T00:00:00.000Z');

describe('applicant experience utilities', () => {
  it('detects current roles from flags, present periods, and missing end dates', () => {
    expect(isCurrentExperience({ isCurrent: true })).toBe(true);
    expect(isCurrentExperience({ is_current_position: true })).toBe(true);
    expect(isCurrentExperience({ period: 'Jan 2024 - Present' })).toBe(true);
    expect(isCurrentExperience({ startMonth: 1, startYear: 2024 })).toBe(true);
    expect(isCurrentExperience({ startMonth: 1, startYear: 2024, endMonth: 2, endYear: 2025 })).toBe(false);
  });

  it('formats structured and legacy timeline labels', () => {
    expect(getExperiencePeriodDisplay({
      startMonth: 2,
      startYear: 2020,
      endMonth: 8,
      endYear: 2021,
    })).toEqual({ startLabel: 'Feb 2020', endLabel: 'Aug 2021' });

    expect(getExperiencePeriodDisplay({ period: 'January 2020 - December 2021' }))
      .toEqual({ startLabel: 'Jan 2020', endLabel: 'Dec 2021' });
  });

  it('calculates entry and total duration defensively', () => {
    const experience: ExperienceEntry[] = [
      { startMonth: 1, startYear: 2020, endMonth: 1, endYear: 2021 },
      { period: 'Jan 2021 - Jun 2021' },
      { period: 'Jan 2025 - Present' },
    ];

    expect(formatExperienceEntryDuration(experience[0], now)).toBe('1 year');
    expect(calculateTotalExperienceDuration(experience, now)).toBe('2 years 10 months');
  });

  it('sorts current roles first and then most recent roles', () => {
    const sorted = sortExperienceByTimeline([
      { company: 'Old', startYear: 2018, startMonth: 1, endYear: 2019, endMonth: 1 },
      { company: 'Current', startYear: 2024, startMonth: 1 },
      { company: 'Recent', startYear: 2022, startMonth: 1, endYear: 2023, endMonth: 1 },
    ]);

    expect(sorted.map(entry => entry.company)).toEqual(['Current', 'Recent', 'Old']);
  });

  it('sorts an ascending timeline from the oldest role to the current role', () => {
    const sorted = sortExperienceByTimelineAscending([
      { company: 'Recent', startYear: 2022, startMonth: 1, endYear: 2023, endMonth: 1 },
      { company: 'Current', startYear: 2024, startMonth: 1 },
      { company: 'Old', startYear: 2018, startMonth: 1, endYear: 2019, endMonth: 1 },
    ]);

    expect(sorted.map(entry => entry.company)).toEqual(['Old', 'Recent', 'Current']);
  });
});
