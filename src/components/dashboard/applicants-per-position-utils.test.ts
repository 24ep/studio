import { describe, expect, it } from 'vitest';

import {
  buildApplicantsPerPositionData,
  getApplicantsPerPositionTotal,
} from './applicants-per-position-utils';
import type { Applicant, Position } from '@/lib/types';

describe('applicants per position utils', () => {
  it('counts applicants by position and sorts active positions by count', () => {
    const applicants = [
      { id: 'a1', positionId: 'p1' },
      { id: 'a2', positionId: 'p1' },
      { id: 'a3', positionId: 'p2' },
      { id: 'a4' },
    ] as Applicant[];
    const positions = [
      { id: 'p1', title: 'Senior Frontend Developer' },
      { id: 'p2', title: 'Designer' },
      { id: 'p3', title: 'No applicants' },
    ] as Position[];

    const data = buildApplicantsPerPositionData(applicants, positions);

    expect(data).toEqual([
      {
        applicants: 2,
        fullPositionTitle: 'Senior Frontend Developer',
        position: 'Senior Front...',
      },
      {
        applicants: 1,
        fullPositionTitle: 'Designer',
        position: 'Designer',
      },
    ]);
    expect(getApplicantsPerPositionTotal(data)).toBe(3);
  });
});
