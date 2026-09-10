import { describe, expect, it } from 'vitest';

import {
  filterApplicantRecruiters,
  formatApplicantRecruiterName,
  getApplicantDisplayRecruiter,
} from './applicant-recruiter-cell-utils';

describe('applicant recruiter cell utilities', () => {
  const recruiters = [
    { id: 'recruiter-1', name: 'Ada Lovelace' },
    { id: 'recruiter-2', name: 'Grace Hopper' },
  ];

  it('formats recruiter names compactly', () => {
    expect(formatApplicantRecruiterName('Ada Lovelace')).toBe('Ada L.');
    expect(formatApplicantRecruiterName('Prince')).toBe('Prince');
    expect(formatApplicantRecruiterName('')).toBe('');
    expect(formatApplicantRecruiterName('  Grace Brewster Hopper  ')).toBe('Grace H.');
  });

  it('filters recruiters case-insensitively and preserves empty search results', () => {
    expect(filterApplicantRecruiters(recruiters, 'ada')).toEqual([recruiters[0]]);
    expect(filterApplicantRecruiters(recruiters, ' HOP ')).toEqual([recruiters[1]]);
    expect(filterApplicantRecruiters(recruiters, '   ')).toBe(recruiters);
    expect(filterApplicantRecruiters(recruiters, 'missing')).toEqual([]);
  });

  it('prefers embedded applicant recruiter data before falling back to available recruiters', () => {
    const embeddedRecruiter = { id: 'recruiter-1', name: 'Embedded Name' };

    expect(getApplicantDisplayRecruiter({
      id: 'applicant-1',
      recruiterId: 'recruiter-1',
      recruiter: embeddedRecruiter,
    }, recruiters)).toBe(embeddedRecruiter);
    expect(getApplicantDisplayRecruiter({
      id: 'applicant-1',
      recruiterId: 'recruiter-2',
    }, recruiters)).toBe(recruiters[1]);
    expect(getApplicantDisplayRecruiter({
      id: 'applicant-1',
      recruiterId: 'missing',
    }, recruiters)).toBeNull();
  });
});
