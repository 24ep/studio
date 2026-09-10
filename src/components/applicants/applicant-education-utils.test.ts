import { describe, expect, it } from 'vitest';

import {
  formatEducationTimelineDuration,
  getEducationFieldLabel,
  getEducationInstitutionLabel,
  getEducationTimelineLabels,
  isCurrentEducation,
  sortEducationByTimeline,
} from './applicant-education-utils';
import type { EducationEntry } from '@/lib/types';

function makeEducation(overrides: Partial<EducationEntry> = {}): EducationEntry {
  return {
    university: 'University',
    ...overrides,
  };
}

describe('applicant education utilities', () => {
  it('formats education labels defensively', () => {
    expect(getEducationFieldLabel(makeEducation({ major: 'Math', field: 'Computer Science' })))
      .toBe('Math - Computer Science');
    expect(getEducationFieldLabel(makeEducation({ major: 'Math' }))).toBe('Math');
    expect(getEducationFieldLabel(makeEducation())).toBe('Field of study not specified');
    expect(getEducationInstitutionLabel(makeEducation({ university: 'MIT', campus: 'Main' }))).toBe('MIT (Main)');
    expect(getEducationInstitutionLabel(makeEducation({ university: '' }))).toBe('University not specified');
  });

  it('builds timeline labels and durations', () => {
    const entry = makeEducation({
      startMonth: 2,
      startYear: 2020,
      endMonth: 8,
      endYear: 2021,
    });

    expect(isCurrentEducation(entry)).toBe(false);
    expect(getEducationTimelineLabels(entry)).toEqual({
      startLabel: 'Feb 2020',
      endLabel: 'Aug 2021',
    });
    expect(formatEducationTimelineDuration(entry)).toBe('(1 Year, 6 Months)');
  });

  it('sorts education entries by period year', () => {
    expect(sortEducationByTimeline([
      makeEducation({ university: 'Old', period: '2018-2020' }),
      makeEducation({ university: 'Recent', period: '2021-2023' }),
      makeEducation({ university: 'Missing' }),
    ]).map(entry => entry.university)).toEqual(['Recent', 'Old', 'Missing']);
  });
});
