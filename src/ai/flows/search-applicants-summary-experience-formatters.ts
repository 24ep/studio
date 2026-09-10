import type { ExperienceEntry } from '@/lib/types';

import {
  formatOptionalSegment,
  truncateDescription,
} from './search-applicants-summary-common-formatters';

function isCurrentExperience(exp: ExperienceEntry) {
  return exp.is_current_position === true || exp.isCurrent === true;
}

function formatExperienceDescription(description?: string | null) {
  return description ? `\n    Description: ${truncateDescription(description)}` : '';
}

function formatExperienceLine(exp: ExperienceEntry, index: number) {
  return [
    `  ${index + 1}. Company: ${exp.company || 'N/A'}, Position: ${exp.position || 'N/A'}`,
    exp.positionLevel ? ` (Level: ${exp.positionLevel})` : '',
    formatOptionalSegment('Period', exp.period),
    formatOptionalSegment('Duration', exp.duration),
    isCurrentExperience(exp) ? ' (Current Position)' : '',
    formatExperienceDescription(exp.description),
  ].join('');
}

export function buildExperienceLines(experience: ExperienceEntry[] | undefined) {
  if (!experience?.length) {
    return [];
  }

  return [
    'Work Experience:',
    ...experience.map(formatExperienceLine),
  ];
}
