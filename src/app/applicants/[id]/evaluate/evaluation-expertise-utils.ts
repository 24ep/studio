import type { EvaluationSummary, TestingResult } from './types';
import {
  applyExpertiseScoreMap,
  buildLatestExpertiseScoreMap,
} from './evaluation-expertise-score-map-utils';
export {
  buildEvaluationTestResultRemovalAction,
} from './evaluation-expertise-removal-action-utils';
export type {
  EvaluationTestResultRemovalAction,
} from './evaluation-expertise-removal-action-utils';
export {
  buildExpertiseTestingResults,
} from './evaluation-expertise-testing-results-utils';
export type {
  ExpertiseEvaluationCriteriaLike,
} from './evaluation-expertise-testing-results-utils';

export function applyExpertiseScoresToTestingResults(
  testingResults: TestingResult[],
  evaluations?: EvaluationSummary[] | null
) {
  const evaluationsArray = Array.isArray(evaluations) ? evaluations : [];
  if (evaluationsArray.length === 0) return testingResults;

  return applyExpertiseScoreMap(testingResults, buildLatestExpertiseScoreMap(evaluationsArray));
}

export function applyEvaluationExpertiseScoresToTestingResults(
  testingResults: TestingResult[],
  evaluation?: EvaluationSummary | null
) {
  if (!evaluation?.expertiseScores || !Array.isArray(evaluation.expertiseScores)) {
    return testingResults;
  }

  return applyExpertiseScoresToTestingResults(testingResults, [evaluation]);
}

export function buildExpertiseScoresForSave(testingResults?: TestingResult[] | null) {
  if (!testingResults || testingResults.length === 0) return undefined;

  const scores = testingResults
    .filter(result => result.score >= 0)
    .map(result => ({
      skillId: result.id,
      score: result.score,
      notes: '',
    }));

  return scores.length > 0 ? scores : undefined;
}
