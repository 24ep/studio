import type { ApplicantDetails } from '@/lib/types';

import { formatOptionalLine } from './search-applicants-summary-common-formatters';

function buildPersonalDetailsLines(details: ApplicantDetails) {
  const personalInfo = details.personal_info;
  if (!personalInfo) {
    return [];
  }

  return [
    formatOptionalLine('Title', personalInfo.title_honorific),
    formatOptionalLine('Nickname', personalInfo.nickname),
    formatOptionalLine('Location', personalInfo.location),
    formatOptionalLine('About Me', personalInfo.introduction_aboutme),
  ];
}

export function buildPersonalInfoLines(details: ApplicantDetails) {
  return [
    formatOptionalLine('CV Language', details.cv_language),
    ...buildPersonalDetailsLines(details),
  ].filter((line): line is string => Boolean(line));
}
