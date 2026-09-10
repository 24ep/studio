import type { ApplicantDetails } from '@/lib/types';

import {
  appendIfPresent,
  formatFitScore,
  formatOptionalLine,
} from './search-applicants-summary-common-formatters';
import {
  buildCustomAttributeLines,
} from './search-applicants-summary-custom-attribute-formatters';
import {
  buildEducationLines,
} from './search-applicants-summary-education-formatters';
import {
  buildExperienceLines,
} from './search-applicants-summary-experience-formatters';
import {
  buildJobMatchLines,
} from './search-applicants-summary-job-match-formatters';
import {
  buildPersonalInfoLines,
} from './search-applicants-summary-personal-formatters';
import {
  buildSkillLines,
} from './search-applicants-summary-skill-formatters';

export {
  appendIfPresent,
  buildCustomAttributeLines,
  formatFitScore,
  formatOptionalLine,
};

export function buildApplicantDetailSummaryLines(details: ApplicantDetails) {
  return [
    ...buildPersonalInfoLines(details),
    ...buildEducationLines(details.education),
    ...buildExperienceLines(details.experience),
    ...buildSkillLines(details.skills),
    ...buildJobMatchLines(details),
  ];
}
