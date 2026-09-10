import { describe, expect, it } from 'vitest';

import {
  filterRecruiterIds,
  getRecruiterDisplayName,
  getRecruiterFallbackColor,
  shouldShowAllRecruitersOption,
  shouldShowNoRecruitersAvailable,
  shouldShowNoSearchMatches,
  shouldShowUnassignedOption
} from './recruiter-filter-sidebar-utils';

const recruiters = [
  { id: '1', name: 'Ada Lovelace' },
  { id: 'abc', name: 'Grace Hopper' }
];

describe('recruiter filter sidebar utilities', () => {
  it('filters recruiters by name and keeps all recruiters for empty search', () => {
    expect(filterRecruiterIds(recruiters, '')).toEqual(['1', 'abc']);
    expect(filterRecruiterIds(recruiters, 'grace')).toEqual(['abc']);
    expect(filterRecruiterIds(recruiters, 'missing')).toEqual([]);
  });

  it('derives sidebar visibility states', () => {
    expect(shouldShowAllRecruitersOption('all')).toBe(true);
    expect(shouldShowAllRecruitersOption('grace')).toBe(false);
    expect(shouldShowUnassignedOption({ unassigned: 0 })).toBe(true);
    expect(shouldShowNoSearchMatches('missing', [], false)).toBe(true);
    expect(shouldShowNoRecruitersAvailable('', [], undefined)).toBe(true);
  });

  it('returns stable fallback recruiter display values', () => {
    expect(getRecruiterDisplayName('r1')).toBe('Recruiter r1');
    expect(getRecruiterDisplayName('r1', { id: 'r1', name: 'A Recruiter' })).toBe('A Recruiter');
    expect(getRecruiterFallbackColor('abc', 7)).toContain('text-');
  });
});
