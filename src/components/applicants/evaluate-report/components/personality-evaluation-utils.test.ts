import { describe, expect, it } from 'vitest';
import {
  getPersonalityGroupAverageScore,
  getPersonalityScoreBorderClass,
} from './personality-evaluation-utils';

describe('personality evaluation utils', () => {
  it('calculates group average percentage', () => {
    expect(getPersonalityGroupAverageScore({
      groupId: 'group-1',
      groupName: 'Leadership',
      groupColor: '#7c3aed',
      traits: [
        { id: 'trait-1', name: 'Ownership', score: 4, percentage: 75 },
        { id: 'trait-2', name: 'Judgment', score: 5, percentage: 100 },
      ],
    })).toBe(87.5);
  });

  it('uses zero for empty trait groups', () => {
    expect(getPersonalityGroupAverageScore({
      groupId: 'group-1',
      groupName: 'Leadership',
      groupColor: '#7c3aed',
      traits: [],
    })).toBe(0);
  });

  it('converts score background classes to border classes', () => {
    expect(getPersonalityScoreBorderClass('bg-green-500')).toBe('border-green-500');
  });
});
