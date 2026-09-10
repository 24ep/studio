import type { EducationEntry } from '@/lib/types';

import { formatOptionalSegment } from './search-applicants-summary-common-formatters';

function formatEducationMajorField(edu: EducationEntry) {
  const fields = [edu.major, edu.field].filter(Boolean);
  return fields.length > 0 ? `, Major/Field: ${fields.join(' / ')}` : '';
}

function formatEducationLine(edu: EducationEntry, index: number) {
  return [
    `  ${index + 1}. University: ${edu.university || 'N/A'}`,
    formatEducationMajorField(edu),
    formatOptionalSegment('Campus', edu.campus),
    formatOptionalSegment('Period', edu.period),
    formatOptionalSegment('Duration', edu.duration),
    formatOptionalSegment('GPA', edu.GPA),
  ].join('');
}

export function buildEducationLines(education: EducationEntry[] | undefined) {
  if (!education?.length) {
    return [];
  }

  return [
    'Education History:',
    ...education.map(formatEducationLine),
  ];
}
