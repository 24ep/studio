import type { ApplicantDetails } from '@/lib/types';

import { formatFitScore } from './search-applicants-summary-common-formatters';

export function buildJobMatchLines(details: ApplicantDetails) {
  if (!details.job_matches || !Array.isArray(details.job_matches) || details.job_matches.length === 0) {
    return [];
  }

  return [
    'Automated Job Matches (from automation):',
    ...details.job_matches.map(match => (
      `  - Job: ${match.jobTitle || match.jobId || 'N/A'}, Fit: ${formatFitScore(match.fitScore)}%, Reasons: ${(match.matchReasons || []).join(', ')}`
    )),
  ];
}
