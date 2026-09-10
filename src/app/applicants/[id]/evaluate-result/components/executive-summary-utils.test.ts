import { describe, expect, it } from 'vitest';
import type { GroupedSkill, GroupedTrait } from '../types';
import {
  getChartColorWithAlpha,
  getGroupedSkillAveragePercentage,
  getGroupedTraitAveragePercentage,
  getOverallExpertiseAverage,
  hexToRgba,
} from './executive-summary-utils';

const traitGroup: GroupedTrait = {
  groupId: 'personality',
  groupName: 'Personality',
  groupColor: '#22C55E',
  traits: [
    { id: 'ownership', name: 'Ownership', score: 4, percentage: 80 },
    { id: 'adaptability', name: 'Adaptability', score: 3, percentage: 60 },
  ],
};

const skillGroups: GroupedSkill[] = [
  {
    groupId: 'frontend',
    groupName: 'Frontend',
    groupColor: '#3B82F6',
    skills: [
      { id: 'react', name: 'React', score: 8, maxScore: 10, percentage: 80 },
      { id: 'css', name: 'CSS', score: 7, maxScore: 10, percentage: 70 },
    ],
  },
  {
    groupId: 'backend',
    groupName: 'Backend',
    groupColor: '#6366F1',
    skills: [
      { id: 'sql', name: 'SQL', score: 9, maxScore: 10, percentage: 90 },
    ],
  },
];

describe('evaluate result executive summary utilities', () => {
  it('converts hex chart colors to rgba fills', () => {
    expect(hexToRgba('#3B82F6', 0.2)).toBe('rgba(59, 130, 246, 0.2)');
    expect(getChartColorWithAlpha('#22C55E', 0.4)).toBe('rgba(34, 197, 94, 0.4)');
    expect(getChartColorWithAlpha('rgb(1, 2, 3)', 0.4)).toBe('rgb(1, 2, 3)');
  });

  it('calculates grouped and overall percentages', () => {
    expect(getGroupedTraitAveragePercentage(traitGroup)).toBe(70);
    expect(getGroupedTraitAveragePercentage({ ...traitGroup, traits: [] })).toBe(0);
    expect(getGroupedSkillAveragePercentage(skillGroups[0])).toBe(75);
    expect(getGroupedSkillAveragePercentage({ ...skillGroups[0], skills: [] })).toBe(0);
    expect(getOverallExpertiseAverage(skillGroups)).toBe(80);
    expect(getOverallExpertiseAverage([])).toBe(0);
  });
});
