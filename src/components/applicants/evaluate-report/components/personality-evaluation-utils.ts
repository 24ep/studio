import type { GroupedTrait } from '../types';

export function getPersonalityGroupAverageScore(group: GroupedTrait) {
  if (group.traits.length === 0) return 0;

  const totalPercentage = group.traits.reduce((sum, trait) => sum + trait.percentage, 0);
  return totalPercentage / group.traits.length;
}

export function getPersonalityScoreBorderClass(backgroundClass: string) {
  return backgroundClass.replace('bg-', 'border-');
}
