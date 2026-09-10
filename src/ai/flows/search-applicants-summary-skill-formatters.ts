import type { SkillEntry } from '@/lib/types';

function formatSkillText(skillEntry: SkillEntry) {
  return skillEntry.skill?.length
    ? skillEntry.skill.join(', ')
    : (skillEntry.skill_string || 'N/A');
}

export function buildSkillLines(skills: SkillEntry[] | undefined) {
  if (!Array.isArray(skills) || skills.length === 0) {
    return [];
  }

  return [
    'Skills:',
    ...skills.map(skillEntry => `  - Segment: ${skillEntry.segment_skill || 'General'}: ${formatSkillText(skillEntry)}`),
  ];
}
