import { describe, expect, it } from 'vitest';

import type { Applicant } from '@/lib/types';
import {
  applyApplicantUpdateToList,
  getSafeInitialApplicants,
  replaceApplicantInList,
} from './applicant-data-state-utils';

function applicant(id: string, name: string): Applicant {
  return { id, name } as unknown as Applicant;
}

describe('applicant data state utilities', () => {
  it('normalizes initial applicant data defensively', () => {
    const applicants = [applicant('a1', 'Ada')];

    expect(getSafeInitialApplicants(applicants)).toBe(applicants);
    expect(getSafeInitialApplicants(null)).toEqual([]);
    expect(getSafeInitialApplicants({ applicants })).toEqual([]);
  });

  it('replaces one applicant without changing unrelated rows', () => {
    const original = [applicant('a1', 'Ada'), applicant('a2', 'Grace')];
    const updated = applicant('a2', 'Grace Hopper');

    expect(replaceApplicantInList(original, 'a2', updated)).toEqual([
      original[0],
      updated,
    ]);
  });

  it('applies optimistic updates with a stable updatedAt value', () => {
    const original = [applicant('a1', 'Ada'), applicant('a2', 'Grace')];

    expect(applyApplicantUpdateToList(
      original,
      'a1',
      { status: 'HIRED' } as Partial<Applicant>,
      '2026-06-10T00:00:00.000Z',
    )).toEqual([
      {
        ...original[0],
        status: 'HIRED',
        updatedAt: '2026-06-10T00:00:00.000Z',
      },
      original[1],
    ]);
  });
});
