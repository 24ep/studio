import { describe, expect, it } from 'vitest';

import {
  filterRecruitersBySearch,
  getSelectedRecruiters,
  removeRecruiterSelection,
  SELECT_ALL_RECRUITER_ID,
  toggleRecruiterSelection,
  UNASSIGNED_RECRUITER_ID,
} from './recruiter-multi-select-utils';

const recruiters = [
  { id: 'r1', name: 'Alice Recruiter' },
  { id: 'r2', name: 'Bob Sourcer' },
];

describe('recruiter multi select utils', () => {
  it('filters and resolves selected recruiters', () => {
    expect(filterRecruitersBySearch(recruiters, 'alice')).toEqual([recruiters[0]]);
    expect(getSelectedRecruiters(recruiters, new Set(['r2']))).toEqual([recruiters[1]]);
  });

  it('toggles select all and unassigned as exclusive selections', () => {
    expect(Array.from(toggleRecruiterSelection(new Set(['r1']), SELECT_ALL_RECRUITER_ID))).toEqual([SELECT_ALL_RECRUITER_ID]);
    expect(Array.from(toggleRecruiterSelection(new Set(['r1']), UNASSIGNED_RECRUITER_ID))).toEqual([UNASSIGNED_RECRUITER_ID]);
    expect(Array.from(toggleRecruiterSelection(new Set([UNASSIGNED_RECRUITER_ID]), 'r2'))).toEqual(['r2']);
  });

  it('removes individual selections without mutating the original set', () => {
    const selectedIds = new Set(['r1', 'r2']);
    const nextSelectedIds = removeRecruiterSelection(selectedIds, 'r1');

    expect(Array.from(nextSelectedIds)).toEqual(['r2']);
    expect(Array.from(selectedIds)).toEqual(['r1', 'r2']);
  });
});
