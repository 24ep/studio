import type { Applicant } from '@/lib/types';
import {
  addBestScoreOrNoScore,
  buildEmptyScoreCounts,
  createApplicantScoreCountBuckets,
  formatApplicantScoreCountBuckets,
} from './applicant-score-count-format-utils';
import type {
  ApplicantScoreCountBuckets,
  ApplicantScoreCounts,
} from './applicant-score-count-types';
import {
  collectAppliedScores,
  collectMatchingScores,
} from './applicant-score-value-utils';

export type { ApplicantScoreCounts } from './applicant-score-count-types';

export function buildApplicantScoreCounts(applicants?: Applicant[] | null): ApplicantScoreCounts {
  const applicantsArray = Array.isArray(applicants) ? applicants : [];
  if (applicantsArray.length === 0) {
    return buildEmptyScoreCounts();
  }

  const buckets = createApplicantScoreCountBuckets();

  for (const applicant of applicantsArray) {
    addApplicantToScoreCountBuckets(buckets, applicant);
  }

  return formatApplicantScoreCountBuckets(buckets);
}

function addApplicantToScoreCountBuckets(
  buckets: ApplicantScoreCountBuckets,
  applicant: Applicant
) {
  addBestScoreOrNoScore(buckets.applied, collectAppliedScores(applicant));
  addBestScoreOrNoScore(buckets.matching, collectMatchingScores(applicant));
}

export function selectApplicantsByIds<T extends { id: string }>(
  applicants?: T[] | null,
  ids?: string[] | null
) {
  if (!Array.isArray(applicants) || !Array.isArray(ids) || ids.length === 0) return [];

  const idSet = new Set(ids);
  return applicants.filter(applicant => idSet.has(applicant.id));
}

export function selectApplicantScoreCountsForDisplay({
  isAiSearchActive,
  aiMatchedApplicantIds,
  allApplicantsForCounts,
  databaseFitScoreCounts,
}: {
  isAiSearchActive: boolean;
  aiMatchedApplicantIds?: string[] | null;
  allApplicantsForCounts?: Applicant[] | null;
  databaseFitScoreCounts?: ApplicantScoreCounts | null;
}) {
  if (isAiSearchActive && aiMatchedApplicantIds && aiMatchedApplicantIds.length > 0) {
    return buildApplicantScoreCounts(selectApplicantsByIds(allApplicantsForCounts, aiMatchedApplicantIds));
  }

  if (databaseFitScoreCounts) {
    return databaseFitScoreCounts;
  }

  return buildApplicantScoreCounts(allApplicantsForCounts);
}
