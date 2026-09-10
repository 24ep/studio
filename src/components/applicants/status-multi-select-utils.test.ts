import { describe, expect, it } from 'vitest';
import type { RecruitmentStage } from "@/lib/types";
import {
  STATUS_SELECT_ALL_ID,
  filterStatusStages,
  getApplicantCountBadgeValue,
  getSelectedStatusStages,
  removeStatusSelection,
  toggleStatusSelection,
} from './status-multi-select-utils';

const stages: RecruitmentStage[] = [
  { id: 'screening', name: 'Screening', description: 'Initial call', isSystem: false },
  { id: 'offer', name: 'Offer', description: null, isSystem: false },
  { id: 'hired', name: 'Hired', isSystem: true },
];

describe('status-multi-select-utils', () => {
  it('filters stages by case-insensitive names and preserves all stages for empty search', () => {
    expect(filterStatusStages(stages, 'off')).toEqual([stages[1]]);
    expect(filterStatusStages(stages, '  HIRED ')).toEqual([stages[2]]);
    expect(filterStatusStages(stages, '   ')).toBe(stages);
  });

  it('toggles select-all as an exclusive status selection', () => {
    expect([...toggleStatusSelection(new Set(['screening']), STATUS_SELECT_ALL_ID)]).toEqual([
      STATUS_SELECT_ALL_ID,
    ]);
    expect([...toggleStatusSelection(new Set([STATUS_SELECT_ALL_ID]), STATUS_SELECT_ALL_ID)]).toEqual([]);
  });

  it('toggles individual stages and removes select-all when needed', () => {
    expect([...toggleStatusSelection(new Set([STATUS_SELECT_ALL_ID]), 'offer')]).toEqual(['offer']);
    expect([...toggleStatusSelection(new Set(['offer']), 'offer')]).toEqual([]);
  });

  it('selects, removes, and displays applicant counts for concrete stages', () => {
    expect(getSelectedStatusStages(stages, new Set(['hired', 'missing']))).toEqual([stages[2]]);
    expect([...removeStatusSelection(new Set(['hired', 'offer']), 'hired')]).toEqual(['offer']);
    expect(getApplicantCountBadgeValue({ hired: 2, offer: 0 }, 'hired')).toBe(2);
    expect(getApplicantCountBadgeValue({ hired: 2, offer: 0 }, 'offer')).toBeNull();
  });
});
