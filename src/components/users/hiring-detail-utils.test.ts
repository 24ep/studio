import { describe, expect, it } from 'vitest';

import type { HiringDetails } from './hiring-detail-types';
import { getApplicantProfileHref, getMatchCriteriaLabels, hasHiringDetails } from './hiring-detail-utils';

const applicant: NonNullable<HiringDetails['applicant']> = {
  id: 'applicant-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: null,
  positionId: null,
  recruitmentStage: null,
  position: null,
  applicationDate: '2026-06-01T00:00:00.000Z'
};

describe('hiring detail utilities', () => {
  it('detects whether linked hiring records exist', () => {
    expect(hasHiringDetails(null)).toBe(false);
    expect(hasHiringDetails({
      headcount: null,
      applicant: null,
      matchCriteria: {
        matchedByEmployeeId: false,
        matchedByEmail: false,
        matchedByPhone: false
      }
    })).toBe(false);
    expect(hasHiringDetails({
      headcount: null,
      applicant,
      matchCriteria: {
        matchedByEmployeeId: false,
        matchedByEmail: true,
        matchedByPhone: false
      }
    })).toBe(true);
  });

  it('builds applicant profile links based on position assignment', () => {
    expect(getApplicantProfileHref(applicant)).toBe('/applicants?applicantId=applicant-1');
    expect(getApplicantProfileHref({ ...applicant, positionId: 'position-1' })).toBe(
      '/positions/position-1?applicantId=applicant-1'
    );
  });

  it('returns clean match criteria labels', () => {
    expect(getMatchCriteriaLabels({
      matchedByEmployeeId: true,
      matchedByEmail: false,
      matchedByPhone: true
    })).toEqual(['Matched by Employee ID', 'Matched by Phone']);
  });
});
