import { describe, expect, it } from 'vitest';
import type { Applicant } from '../../lib/types';
import { getMultiRecruiterStageApplicants } from './ApplicantMultiRecruiterKanbanUtils';

function makeApplicant(overrides: Partial<Applicant>): Applicant {
  return {
    id: overrides.id || 'applicant-1',
    name: overrides.name || 'Ada',
    email: overrides.email || 'ada@example.com',
    parsedData: null,
    positionId: null,
    fitScore: 0,
    statusId: '',
    status: overrides.status || 'Screening',
    applicationDate: '2026-01-01',
    recruiterId: overrides.recruiterId || 'recruiter-1',
    transitionHistory: [],
  };
}

describe('ApplicantMultiRecruiterKanbanUtils', () => {
  it('filters applicants by stage and recruiter', () => {
    const applicants = [
      makeApplicant({ id: 'a1', status: 'Screening', recruiterId: 'r1' }),
      makeApplicant({ id: 'a2', status: 'Screening', recruiterId: 'r2' }),
      makeApplicant({ id: 'a3', status: 'Interview', recruiterId: 'r1' }),
    ];

    expect(getMultiRecruiterStageApplicants(applicants, 'Screening', 'r1').map((applicant) => applicant.id))
      .toEqual(['a1']);
  });
});
