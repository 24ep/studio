import { describe, expect, it } from 'vitest';
import type { Applicant } from '@/lib/types';
import { groupApplicantsForApplicantPage } from './applicant-grouping-utils';

function makeApplicant(overrides: Partial<Applicant>): Applicant {
  return {
    id: overrides.id || 'applicant',
    name: overrides.name || 'Applicant',
    email: overrides.email || 'applicant@example.com',
    parsedData: null,
    positionId: overrides.positionId ?? null,
    position: overrides.position,
    fitScore: overrides.fitScore ?? 0,
    statusId: overrides.statusId || 'stage-1',
    status: overrides.status,
    applicationDate: overrides.applicationDate || '2026-01-01T00:00:00.000Z',
    recruiterId: overrides.recruiterId,
    recruiter: overrides.recruiter,
    transitionHistory: [],
  };
}

describe('applicant grouping utilities', () => {
  it('groups applicants by position, recruiter, and status labels', () => {
    const applicants = [
      makeApplicant({ id: 'a', positionId: 'position-1', recruiterId: 'recruiter-1', statusId: 'stage-1' }),
      makeApplicant({ id: 'b', positionId: 'position-1', recruiterId: 'recruiter-2', statusId: 'stage-2' }),
      makeApplicant({ id: 'c', positionId: null, recruiterId: null, statusId: 'stage-1' }),
    ];
    const shared = {
      applicants,
      availablePositions: [{ id: 'position-1', title: 'Designer', department: 'Product', isOpen: true }],
      availableRecruiter: [{ id: 'recruiter-1', name: 'Mina' }, { id: 'recruiter-2', name: 'Jo' }],
      stageNames: { 'stage-1': 'Applied', 'stage-2': 'Interview' },
    };

    expect(groupApplicantsForApplicantPage({ ...shared, groupBy: 'position' }).map((group) => group.label))
      .toEqual(['Designer', 'No position']);
    expect(groupApplicantsForApplicantPage({ ...shared, groupBy: 'recruiter' }).map((group) => group.label))
      .toEqual(['Mina', 'Jo', 'Unassigned recruiter']);
    expect(groupApplicantsForApplicantPage({ ...shared, groupBy: 'status' }).map((group) => group.label))
      .toEqual(['Applied', 'Interview']);
  });

  it('returns a single all-applicants group when grouping is disabled', () => {
    const applicants = [makeApplicant({ id: 'a' })];

    expect(groupApplicantsForApplicantPage({
      applicants,
      availablePositions: [],
      availableRecruiter: [],
      groupBy: 'none',
      stageNames: {},
    })).toEqual([{ key: 'all', label: 'All applicants', applicants }]);
  });
});
